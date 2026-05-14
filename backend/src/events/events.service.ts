import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicEvents(filters?: {
    team?: string;
    competition?: string;
    city?: string;
    influencerId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    take?: number;
    skip?: number;
  }) {
    const where: any = { status: 'ACTIVE' };

    if (filters?.team) {
      where.OR = [
        { homeTeam: { contains: filters.team, mode: 'insensitive' } },
        { awayTeam: { contains: filters.team, mode: 'insensitive' } },
        { influencer: { teamSupported: { contains: filters.team, mode: 'insensitive' } } },
      ];
    }

    if (filters?.competition) {
      where.competition = { contains: filters.competition, mode: 'insensitive' };
    }

    if (filters?.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    if (filters?.influencerId) {
      where.organizerId = filters.influencerId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.dateTime = {};
      if (filters.dateFrom) where.dateTime.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.dateTime.lte = new Date(filters.dateTo);
    }

    if (filters?.search) {
      where.influencer = {
        ...where.influencer,
        name: { contains: filters.search, mode: 'insensitive' },
      };
    }

    return this.prisma.event.findMany({
      where,
      orderBy: { dateTime: 'asc' },
      take: filters?.take ?? 20,
      skip: filters?.skip ?? 0,
      include: {
        influencer: {
          select: {
            id: true,
            name: true,
            slug: true,
            profilePhoto: true,
            teamSupported: true,
            teamColor: true,
            isVerified: true,
          },
        },
      },
    });
  }

  async createEvent(organizerId: string, data: any) {
    const baseSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const suffix = Math.random().toString(36).substring(2, 7);
    const slug = `${baseSlug}-${suffix}`;

    return this.prisma.event.create({
      data: {
        ...data,
        slug,
        organizerId,
      },
    });
  }

  async getEventsByOrganizer(organizerId: string, userRole: string) {
    if (userRole === 'SUPER_ADMIN') {
      return this.prisma.event.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          influencer: { select: { name: true, slug: true } },
        },
      });
    }
    return this.prisma.event.findMany({
      where: { organizerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEventById(id: string, organizerId: string, userRole: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    if (userRole !== 'SUPER_ADMIN' && event.organizerId !== organizerId) {
      throw new NotFoundException('Unauthorized access to event');
    }
    return event;
  }

  async getEventStats(eventId: string, organizerId: string, userRole: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        staffAssignments: { include: { staff: true } },
      },
    });

    if (!event) throw new NotFoundException('Event not found');
    if (userRole !== 'SUPER_ADMIN' && event.organizerId !== organizerId) {
      throw new NotFoundException('Unauthorized access to event stats');
    }

    const recentScans = await this.prisma.scanLog.findMany({
      where: { eventId },
      orderBy: { scannedAt: 'desc' },
      take: 50,
      include: { ticket: true, staff: true },
    });

    const paidTicketCount = await this.prisma.ticket.count({
      where: { eventId, status: { in: ['ISSUED', 'SCANNED'] } },
    });
    const totalSalesValue = paidTicketCount * event.ticketPrice;

    const attendeesEntered = await this.prisma.scanLog.count({ where: { eventId } });

    // Submission verification stats
    const [pendingSubmissions, flaggedSubmissions, approvedSubmissions, rejectedSubmissions] = await Promise.all([
      this.prisma.ticket.count({ where: { eventId, verificationStatus: 'PENDING_EXTRACTION' } }),
      this.prisma.ticket.count({ where: { eventId, verificationStatus: { in: ['EXTRACTED_HIGH_CONFIDENCE', 'EXTRACTED_LOW_CONFIDENCE', 'MANUAL_REVIEW_REQUIRED'] } } }),
      this.prisma.ticket.count({ where: { eventId, verificationStatus: 'VERIFIED' } }),
      this.prisma.ticket.count({ where: { eventId, verificationStatus: 'REJECTED' } }),
    ]);

    return {
      ticketsSold: event.ticketsSold,
      maxCapacity: event.maxCapacity,
      attendeesEntered,
      eventStatus: event.status,
      totalSalesValue,
      submissions: {
        pending: pendingSubmissions,
        flagged: flaggedSubmissions,
        approved: approvedSubmissions,
        rejected: rejectedSubmissions,
        needsReview: pendingSubmissions + flaggedSubmissions,
      },
      staff: event.staffAssignments.map((es) => ({
        id: es.staff.id,
        name: es.staff.name,
      })),
      recentScans: recentScans.map((s) => ({
        id: s.id,
        scannedAt: s.scannedAt,
        buyerPhone: s.ticket.buyerPhone,
        staffName: s.staff ? s.staff.name : `Admin (${s.scannedByRole})`,
        result: s.result,
      })),
    };
  }

  async updateEventStatus(eventId: string, organizerId: string, userRole: string, status: any) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    if (userRole !== 'SUPER_ADMIN' && event.organizerId !== organizerId) {
      throw new NotFoundException('Unauthorized access to update event');
    }

    // Protection: Cannot update status if event is already COMPLETED or CANCELLED
    if (['COMPLETED', 'CANCELLED'].includes(event.status)) {
      throw new BadRequestException(`Cannot update status of a ${event.status} event.`);
    }

    if (status === 'ACTIVE') {
      if (event.ticketPrice <= 0)
        throw new BadRequestException('Cannot activate an event with a zero ticket price.');
      if (!event.venue || event.venue.trim().length === 0)
        throw new BadRequestException('Cannot activate an event without a valid venue.');
    }

    return this.prisma.event.update({ where: { id: eventId }, data: { status } });
  }

  async cancelEvent(eventId: string, organizerId: string, userRole: string, data: { refundPolicy: string, organizerContact: string }) {
    const event = await this.prisma.event.findUnique({ 
      where: { id: eventId },
      include: { 
        tickets: { 
          where: { status: 'ISSUED' },
          select: { buyerPhone: true, id: true }
        } 
      }
    });
    
    if (!event) throw new NotFoundException('Event not found');
    if (userRole !== 'SUPER_ADMIN' && event.organizerId !== organizerId) {
      throw new NotFoundException('Unauthorized access');
    }

    // 1. Update event status and refund info
    const updatedEvent = await this.prisma.event.update({
      where: { id: eventId },
      data: { 
        status: 'CANCELLED',
        refundPolicy: data.refundPolicy,
        organizerContact: data.organizerContact,
        refundStatus: 'NOT_STARTED'
      }
    });

    // 2. Invalidate unused tickets (set to CANCELLED_PENDING_REFUND)
    await this.prisma.ticket.updateMany({
      where: { 
        eventId, 
        status: 'ISSUED' 
      },
      data: { 
        status: 'CANCELLED_PENDING_REFUND' 
      }
    });

    // 3. Notify attendees (Background)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const phones = [...new Set(event.tickets.map(t => t.buyerPhone))];
    
    // We send notifications in background to avoid blocking the request
    for (const phone of phones) {
      const ticket = event.tickets.find(t => t.buyerPhone === phone);
      this.notificationsService.sendSms(
        phone,
        `FanPass: "${event.title}" has been CANCELLED. For refund info, visit: ${frontendUrl}/tickets/${ticket?.id}`
      ).catch(err => console.error(`Failed to notify ${phone} about cancellation:`, err.message));
    }

    return updatedEvent;
  }

  async getEventBySlug(slug: string) {
    const event = await this.prisma.event.findUnique({
      where: { slug },
      include: {
        influencer: {
          select: {
            id: true,
            name: true,
            slug: true,
            profilePhoto: true,
            teamSupported: true,
            teamColor: true,
            isVerified: true,
            tiktokUrl: true,
            instagramUrl: true,
            telegramUrl: true,
          },
        },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async updateEvent(eventId: string, organizerId: string, userRole: string, data: any) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    if (userRole !== 'SUPER_ADMIN' && event.organizerId !== organizerId) {
      throw new NotFoundException('Unauthorized access to update event');
    }

    // Don't allow changing organizerId or slug via this method for security
    const { organizerId: _, slug: __, ...updateData } = data;

    return this.prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });
  }

  async deleteEvent(eventId: string, organizerId: string, userRole: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    if (userRole !== 'SUPER_ADMIN' && event.organizerId !== organizerId) {
      throw new NotFoundException('Unauthorized access to delete event');
    }

    // Only allow deletion of DRAFT or CANCELLED events to prevent data loss for sold tickets
    if (!['DRAFT', 'CANCELLED'].includes(event.status)) {
      throw new BadRequestException('Only DRAFT or CANCELLED events can be deleted. Close active events instead.');
    }

    await this.prisma.event.delete({ where: { id: eventId } });
    return { success: true };
  }
}
