import { Injectable, BadRequestException, ConflictException, UnauthorizedException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReceiptsService } from '../receipts/receipts.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class TicketsService {
  private readonly JWT_SECRET = process.env.TICKET_JWT_SECRET || 'ticket-secret-key-999';
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly receiptsService: ReceiptsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── NEW: Submit ticket with receipt ───────────────────────────

  async submitTicket(data: {
    eventId: string;
    buyerPhone: string;
    buyerName: string;
    ticketCount?: number;
    screenshotBase64: string;
    mimeType: string;
    note?: string;
  }) {
    const ticketCount = data.ticketCount || 1;
    const maxPerPerson = parseInt(process.env.MAX_TICKETS_PER_PERSON || '4', 10);

    // 1. Validate event
    const event = await this.prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event || event.status !== 'ACTIVE') {
      throw new BadRequestException('Event is not active or not found');
    }

    // 2. Check ticket count limit per phone
    const existingCount = await this.prisma.ticket.count({
      where: {
        eventId: data.eventId,
        buyerPhone: data.buyerPhone,
        verificationStatus: { in: ['PENDING_EXTRACTION', 'EXTRACTED_HIGH_CONFIDENCE', 'EXTRACTED_LOW_CONFIDENCE', 'MANUAL_REVIEW_REQUIRED', 'VERIFIED'] },
      },
    });

    if (existingCount + ticketCount > maxPerPerson) {
      throw new BadRequestException(`Maximum ${maxPerPerson} tickets per person for this event. You already have ${existingCount}.`);
    }

    // 3. Check capacity
    const pendingCount = await this.prisma.ticket.count({
      where: {
        eventId: data.eventId,
        verificationStatus: { in: ['PENDING_EXTRACTION', 'EXTRACTED_HIGH_CONFIDENCE', 'EXTRACTED_LOW_CONFIDENCE', 'MANUAL_REVIEW_REQUIRED'] },
      },
    });

    if (event.ticketsSold + pendingCount + ticketCount > event.maxCapacity) {
      throw new BadRequestException('Event is sold out or insufficient capacity remaining');
    }

    // 4. Upload receipt image to Cloudinary
    const screenshotUrl = await this.receiptsService.uploadReceiptImage(
      data.screenshotBase64,
      data.mimeType,
    );

    // 5. Compute image hash for duplicate detection
    const imageBuffer = Buffer.from(data.screenshotBase64, 'base64');
    const imageHash = await this.receiptsService.computeImageHash(imageBuffer);

    // 6. Check for duplicate image
    const imageDup = await this.receiptsService.checkDuplicateImage(imageHash);

    // 7. Run AI extraction
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
    const aiMimeType = validMimeTypes.includes(data.mimeType as any)
      ? (data.mimeType as 'image/jpeg' | 'image/png' | 'image/webp')
      : 'image/jpeg';

    const expectedAmount = event.expectedAmount || Math.round(event.ticketPrice / 100); // convert santim to ETB
    const extraction = await this.receiptsService.extractReceiptData(
      data.screenshotBase64,
      aiMimeType,
      expectedAmount * ticketCount,
      event.currency,
    );

    // 8. Check for duplicate transaction reference
    let refDup: { isDuplicate: boolean; matchingTicketId?: string } = { isDuplicate: false };
    if (extraction.transactionRef) {
      refDup = await this.receiptsService.checkDuplicateRef(extraction.transactionRef);
    }

    // 9. Determine verification status
    let verificationStatus: any = 'EXTRACTED_HIGH_CONFIDENCE';
    const allFlags = [...(extraction.flags || [])];

    if (allFlags.includes('ai_error') || allFlags.includes('parse_error') || allFlags.includes('ai_disabled')) {
      verificationStatus = 'MANUAL_REVIEW_REQUIRED';
    } else {
      if (imageDup.isDuplicate) {
        allFlags.push('possible duplicate image');
      }
      if (refDup.isDuplicate) {
        allFlags.push('duplicate transaction reference');
      }

      // If flags exist or confidence is low, it's low confidence
      if (allFlags.length > 0 || extraction.confidence < 0.8) {
        verificationStatus = 'EXTRACTED_LOW_CONFIDENCE';
      }
    }

    // 10. Create ticket
    const ticket = await this.prisma.ticket.create({
      data: {
        eventId: data.eventId,
        buyerPhone: data.buyerPhone,
        buyerName: data.buyerName,
        ticketCount,
        note: data.note,
        status: 'PENDING',
        screenshotUrl,
        screenshotUploadedAt: new Date(),
        imageHash: imageHash || null,
        extractedAmount: extraction.amount,
        extractedSenderName: extraction.senderName,
        extractedDate: extraction.date,
        extractedRef: extraction.transactionRef,
        aiConfidenceScore: extraction.confidence,
        aiRawText: JSON.stringify(extraction),
        verificationStatus,
      },
    });

    // 11. Notify organizer via SMS (if enabled)
    if (process.env.ORGANIZER_NOTIFICATION_SMS === 'true') {
      try {
        const influencer = await this.prisma.influencer.findUnique({
          where: { id: event.organizerId },
        });
        if (influencer) {
          const lastFour = data.buyerPhone.slice(-4);
          const flagsText = allFlags.length > 0 ? `\nFlags: ${allFlags.join(', ')}` : '';
          const confidence = Math.round(extraction.confidence * 100);
          await this.notificationsService.sendOrganizerNotificationSms(
            influencer.phone,
            event.title,
            data.buyerName,
            lastFour,
            confidence,
            flagsText,
            event.id,
          );
        }
      } catch (err: any) {
        this.logger.error(`Failed to send organizer notification: ${err.message}`);
      }
    }

    return {
      ticketId: ticket.id,
      verificationStatus: ticket.verificationStatus,
      extraction: {
        amount: extraction.amount,
        currency: extraction.currency,
        senderName: extraction.senderName,
        date: extraction.date,
        transactionRef: extraction.transactionRef,
        confidence: extraction.confidence,
        flags: allFlags,
        amountMatch: extraction.amount !== null && extraction.amount === expectedAmount * ticketCount,
      },
    };
  }

  // ─── Approve ticket ────────────────────────────────────────────

  async approveTicket(ticketId: string, reviewerId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { event: { include: { influencer: true } } },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.verificationStatus === 'VERIFIED') {
      throw new BadRequestException('Ticket already approved');
    }
    if (ticket.verificationStatus === 'REJECTED') {
      throw new BadRequestException('Cannot approve a rejected ticket');
    }
    if (ticket.event.status === 'CANCELLED') {
      throw new BadRequestException('Cannot approve tickets for a cancelled event.');
    }

    // Generate QR token
    const qrToken = this.signTicketToken(ticket.id, ticket.eventId);

    // Atomic update
    const updatedTicket = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          verificationStatus: 'VERIFIED',
          status: 'ISSUED',
          qrToken,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        },
      });

      // Increment ticketsSold (by ticketCount)
      await tx.event.update({
        where: { id: ticket.eventId },
        data: { ticketsSold: { increment: ticket.ticketCount } },
      });

      // Increment totalTicketsSold on influencer
      await tx.influencer.update({
        where: { id: ticket.event.organizerId },
        data: { totalTicketsSold: { increment: ticket.ticketCount } },
      });

      return updated;
    });

    // Send SMS to fan (Background)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const ticketUrl = `${frontendUrl}/tickets/${ticket.id}`;
    
    // Initial attempt
    this.sendSmsAndTrack(ticket.id, ticket.buyerPhone, ticket.event.title, ticketUrl);

    return { success: true, message: 'Ticket approved and issued.', data: updatedTicket };
  }

  private async sendSmsAndTrack(ticketId: string, phone: string, eventTitle: string, ticketUrl: string) {
    const startTime = new Date();
    try {
      // First, set to PENDING if it's the first attempt
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { 
          smsStatus: 'PENDING',
          lastSmsAttempt: startTime
        }
      });

      const result = await this.notificationsService.sendApprovalSms(phone, eventTitle, ticketUrl);
      
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          smsStatus: result.success ? 'SENT' : 'FAILED',
          smsRetryCount: { increment: 1 },
          smsError: result.success ? null : (result.error || 'Unknown SMS error'),
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to send approval SMS for ticket ${ticketId}: ${error.message}`);
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          smsStatus: 'FAILED',
          smsRetryCount: { increment: 1 },
          smsError: error.message,
        },
      });
    }
  }

  async resendSms(ticketId: string, userId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { event: true },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.verificationStatus !== 'VERIFIED') {
      throw new BadRequestException('Can only send SMS for verified tickets');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const ticketUrl = `${frontendUrl}/tickets/${ticket.id}`;

    // Await this one for better UI feedback on manual resend
    await this.sendSmsAndTrack(ticket.id, ticket.buyerPhone, ticket.event.title, ticketUrl);

    return { success: true, message: 'SMS resend attempt completed.' };
  }

  // ─── Reject ticket ─────────────────────────────────────────────

  async rejectTicket(ticketId: string, reviewerId: string, reason: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { event: { include: { influencer: true } } },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.verificationStatus === 'VERIFIED') {
      throw new BadRequestException('Cannot reject an approved ticket');
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        verificationStatus: 'REJECTED',
        status: 'EXPIRED',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    // Send SMS to fan
    this.notificationsService.sendRejectionSms(
      ticket.buyerPhone,
      ticket.event.title,
      reason,
      ticket.event.influencer.phone,
    ).catch((err) => {
      this.logger.error(`Failed to send rejection SMS for ticket ${ticket.id}: ${err.message}`);
    });

    return updatedTicket;
  }

  // ─── Get ticket status (fan polling) ───────────────────────────

  async getTicketStatus(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        verificationStatus: true,
        status: true,
        rejectionReason: true,
        reviewedAt: true,
        issuedAt: true,
        buyerPhone: true,
        event: {
          select: {
            title: true,
            dateTime: true,
          },
        },
      },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  // ─── Get event submissions (approval dashboard) ────────────────

  async getEventSubmissions(
    eventId: string,
    status?: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const where: any = { eventId };

    if (status === 'needs_review') {
      where.verificationStatus = { in: ['PENDING_EXTRACTION', 'EXTRACTED_HIGH_CONFIDENCE', 'EXTRACTED_LOW_CONFIDENCE', 'MANUAL_REVIEW_REQUIRED'] };
    } else if (status === 'approved') {
      where.verificationStatus = 'VERIFIED';
    } else if (status === 'rejected') {
      where.verificationStatus = 'REJECTED';
    }

    const [submissions, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        orderBy: [
          // Priority sorting based on verification status
          { verificationStatus: 'asc' },
          { issuedAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          buyerName: true,
          buyerPhone: true,
          ticketCount: true,
          note: true,
          issuedAt: true,
          screenshotUrl: true,
          extractedAmount: true,
          extractedSenderName: true,
          extractedDate: true,
          extractedRef: true,
          aiConfidenceScore: true,
          aiRawText: true,
          verificationStatus: true,
          reviewedBy: true,
          reviewedAt: true,
          rejectionReason: true,
          imageHash: true,
          event: {
            select: {
              expectedAmount: true,
              ticketPrice: true,
              currency: true,
              title: true,
            },
          },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { submissions, total, page, limit };
  }

  // ─── Get all submissions across events (super admin) ───────────

  async getAllSubmissions(
    status?: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const where: any = {};

    if (status === 'needs_review') {
      where.verificationStatus = { in: ['PENDING_EXTRACTION', 'EXTRACTED_HIGH_CONFIDENCE', 'EXTRACTED_LOW_CONFIDENCE', 'MANUAL_REVIEW_REQUIRED'] };
    } else if (status === 'approved') {
      where.verificationStatus = 'VERIFIED';
    } else if (status === 'rejected') {
      where.verificationStatus = 'REJECTED';
    }

    // Only include tickets that have a screenshot (i.e. new system tickets)
    where.screenshotUrl = { not: null };

    const [submissions, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        orderBy: [
          { verificationStatus: 'asc' },
          { issuedAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          buyerName: true,
          buyerPhone: true,
          ticketCount: true,
          issuedAt: true,
          screenshotUrl: true,
          extractedAmount: true,
          extractedSenderName: true,
          extractedDate: true,
          extractedRef: true,
          aiConfidenceScore: true,
          aiRawText: true,
          verificationStatus: true,
          reviewedAt: true,
          rejectionReason: true,
          event: {
            select: {
              id: true,
              title: true,
              expectedAmount: true,
              ticketPrice: true,
              currency: true,
              influencer: {
                select: { name: true, slug: true },
              },
            },
          },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { submissions, total, page, limit };
  }

  // ─── Resubmit (from rejected ticket) ──────────────────────────

  async resubmitTicket(ticketId: string, data: {
    screenshotBase64: string;
    mimeType: string;
    note?: string;
  }) {
    const original = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { event: true },
    });

    if (!original) throw new NotFoundException('Original ticket not found');
    if (original.verificationStatus !== 'REJECTED') {
      throw new BadRequestException('Can only resubmit rejected tickets');
    }

    // Create new submission with same buyer info
    return this.submitTicket({
      eventId: original.eventId,
      buyerPhone: original.buyerPhone,
      buyerName: original.buyerName || '',
      ticketCount: original.ticketCount,
      screenshotBase64: data.screenshotBase64,
      mimeType: data.mimeType,
      note: data.note,
    });
  }

  // ─── Duplicate phone warning check ─────────────────────────────

  async checkDuplicatePhone(eventId: string, phone: string) {
    const existing = await this.prisma.ticket.findMany({
      where: {
        eventId,
        buyerPhone: phone,
        verificationStatus: 'VERIFIED',
      },
      select: { id: true },
    });

    return { hasDuplicate: existing.length > 0, count: existing.length };
  }

  // ─── Submission stats for an event ─────────────────────────────

  async getSubmissionStats(eventId: string) {
    const [pending, flagged, approved, rejected] = await Promise.all([
      this.prisma.ticket.count({ where: { eventId, verificationStatus: 'PENDING_EXTRACTION' } }),
      this.prisma.ticket.count({ where: { eventId, verificationStatus: { in: ['EXTRACTED_HIGH_CONFIDENCE', 'EXTRACTED_LOW_CONFIDENCE', 'MANUAL_REVIEW_REQUIRED'] } } }),
      this.prisma.ticket.count({ where: { eventId, verificationStatus: 'VERIFIED' } }),
      this.prisma.ticket.count({ where: { eventId, verificationStatus: 'REJECTED' } }),
    ]);

    return { pending, flagged, approved, rejected, needsReview: pending + flagged };
  }

  // ─── UNCHANGED: Ticket validation (door scanning) ─────────────

  async validateTicket(eventId: string, user: any, token: string) {
    // 1. Verify Authorization to scan for this event
    if (user.role === 'STAFF') {
      const assignment = await this.prisma.eventStaff.findUnique({
        where: { eventId_staffId: { eventId, staffId: user.id } },
      });
      if (!assignment) {
        throw new UnauthorizedException('Staff member is not assigned to this event');
      }
    } else if (user.role === 'ORGANIZER') {
      const event = await this.prisma.event.findUnique({ where: { id: eventId } });
      if (!event || event.organizerId !== user.id) {
        throw new UnauthorizedException('Organizer does not own this event');
      }
    }
    // SUPER_ADMIN is implicitly allowed

    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;

      if (decoded.eventId !== eventId) {
        throw new UnauthorizedException('Ticket not valid for this event');
      }

      const { result, ticket, error } = await this.prisma.$transaction(async (tx) => {
        // Use row-level locking (SELECT ... FOR UPDATE) to prevent double-scans
        const tickets = await tx.$queryRaw<any[]>`
          SELECT * FROM "Ticket" 
          WHERE id = ${decoded.ticketId} 
          FOR UPDATE
        `;
        const ticket = tickets[0];

        if (!ticket) {
          return { result: 'INVALID', error: new BadRequestException('Ticket not found') };
        }
        if (ticket.status === 'ALREADY_USED' || ticket.status === 'SCANNED') {
          return { result: 'ALREADY_USED', error: new ConflictException('Ticket already scanned') };
        }
        if (ticket.status === 'CANCELLED_PENDING_REFUND') {
          return { result: 'EVENT_CANCELLED', error: new BadRequestException('Event has been cancelled.') };
        }
        if (ticket.status !== 'ISSUED') {
          return { result: 'INVALID', error: new BadRequestException('Ticket not valid for entry') };
        }

        // Mark as scanned
        const updatedTicket = await tx.ticket.update({
          where: { id: ticket.id },
          data: { status: 'SCANNED' },
        });

        return { result: 'VALID', ticket: updatedTicket };
      });

      // Log the scan result (even if it was a failure)
      await this.prisma.scanLog.create({
        data: {
          ticketId: decoded.ticketId,
          eventId: eventId,
          staffId: user.role === 'STAFF' ? user.id : null,
          scannedById: user.id,
          scannedByRole: user.role,
          result,
        },
      });

      if (error) throw error;

      return { 
        success: true, 
        result: 'VALID',
        buyerName: ticket.buyerName,
        buyerPhone: ticket.buyerPhone,
        issuedAt: ticket.issuedAt,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return { success: false, result: 'INVALID', message: 'Invalid ticket token' };
      }
      if (error instanceof UnauthorizedException || error instanceof BadRequestException || error instanceof ConflictException) {
        // Return structured error instead of throwing to help frontend UI flashes
        const res = error.getResponse() as any;
        return { 
          success: false, 
          result: res.error === 'Conflict' ? 'ALREADY_USED' : 'INVALID',
          message: res.message 
        };
      }
      throw error;
    }
  }

  // ─── UNCHANGED: Offline scan sync ─────────────────────────────

  async syncOfflineScans(eventId: string, user: any, scans: any[]) {
    const results: any[] = [];

    for (const scan of scans) {
      try {
        const decoded = jwt.verify(scan.token, this.JWT_SECRET) as any;
        if (decoded.eventId !== eventId) {
          results.push({ token: scan.token, result: 'WRONG_EVENT' });
          continue;
        }

        const scanResult = await this.prisma.$transaction(async (tx) => {
          const tickets = await tx.$queryRaw<any[]>`SELECT * FROM "Ticket" WHERE id = ${decoded.ticketId} FOR UPDATE`;
          const ticket = tickets[0];

          if (!ticket) return 'INVALID';
          if (ticket.status === 'SCANNED') return 'ALREADY_USED';
          if (ticket.status !== 'ISSUED') return 'INVALID';

          await tx.ticket.update({
            where: { id: ticket.id },
            data: { status: 'SCANNED', scannedAt: new Date(scan.scannedAt) },
          });

          return 'VALID';
        });

        await this.prisma.scanLog.create({
          data: {
            ticketId: decoded.ticketId,
            eventId: eventId,
            staffId: user.role === 'STAFF' ? user.id : null,
            scannedById: user.id,
            scannedByRole: user.role,
            result: scanResult,
            scannedAt: new Date(scan.scannedAt),
            deviceInfo: scan.deviceInfo,
          },
        });

        results.push({ token: scan.token, result: scanResult });
      } catch (err) {
        results.push({ token: scan.token, result: 'INVALID' });
      }
    }

    return { success: true, results };
  }

  // ─── UNCHANGED: JWT signing ────────────────────────────────────

  signTicketToken(ticketId: string, eventId: string) {
    return jwt.sign({ ticketId, eventId }, this.JWT_SECRET);
  }

  // ─── UNCHANGED: Get ticket ─────────────────────────────────────

  async getTicket(ticketId: string) {
    return this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { event: true },
    });
  }



  // ─── UNCHANGED: Sync manifest ─────────────────────────────────

  async getSyncManifest(eventId: string, user: any) {
    // Verify authorization
    if (user.role === 'STAFF') {
      const assignment = await this.prisma.eventStaff.findUnique({
        where: { eventId_staffId: { eventId, staffId: user.id } },
      });
      if (!assignment) throw new UnauthorizedException('Staff member is not assigned to this event');
    } else if (user.role === 'ORGANIZER') {
      const event = await this.prisma.event.findUnique({ where: { id: eventId } });
      if (!event || event.organizerId !== user.id) throw new UnauthorizedException('Organizer does not own this event');
    }

    const tickets = await this.prisma.ticket.findMany({
      where: {
        eventId,
        status: { in: ['ISSUED', 'SCANNED'] },
      },
      select: {
        id: true,
        status: true,
        buyerName: true,
        buyerPhone: true,
      },
    });

    return { success: true, data: tickets };
  }
}
