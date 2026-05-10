import { Injectable, BadRequestException, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class TicketsService {
  private readonly JWT_SECRET = process.env.TICKET_JWT_SECRET || 'ticket-secret-key-999';

  constructor(private readonly prisma: PrismaService) {}

  async initiateTicket(data: any) {
    return await this.prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: data.eventId },
      });

      if (!event || event.status !== 'ACTIVE') {
        throw new BadRequestException('Event is not active or not found');
      }

      if (event.ticketsSold >= event.maxCapacity) {
        throw new BadRequestException('Event is sold out');
      }

      // Create ticket
      const ticket = await tx.ticket.create({
        data: {
          eventId: data.eventId,
          buyerPhone: data.buyerPhone,
          buyerName: data.buyerName,
          status: 'PENDING',
        },
      });

      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          ticketId: ticket.id,
          amount: event.ticketPrice,
          currency: event.currency,
          status: 'PENDING',
          provider: data.paymentMethod || 'TELEBIRR',
        },
      });

      // Increment sold count (atomic hold)
      await tx.event.update({
        where: { id: data.eventId },
        data: { ticketsSold: { increment: 1 } },
      });

      return { ticket, transaction };
    });
  }

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

      return await this.prisma.$transaction(async (tx) => {
        // Use row-level locking (SELECT ... FOR UPDATE) to prevent double-scans
        const tickets = await tx.$queryRaw<any[]>`
          SELECT * FROM "Ticket" 
          WHERE id = ${decoded.ticketId} 
          FOR UPDATE
        `;
        const ticket = tickets[0];

        if (!ticket) throw new BadRequestException('Ticket not found');
        if (ticket.status === 'SCANNED') throw new ConflictException('Ticket already scanned');
        if (ticket.status !== 'ISSUED') throw new BadRequestException('Ticket not valid for entry');

        // Mark as scanned
        const updatedTicket = await tx.ticket.update({
          where: { id: ticket.id },
          data: { status: 'SCANNED' },
        });

        // Log scan
        await tx.scanLog.create({
          data: {
            ticketId: ticket.id,
            eventId: eventId,
            staffId: user.role === 'STAFF' ? user.id : null,
            scannedById: user.id,
            scannedByRole: user.role,
            result: 'VALID',
          },
        });

        return { success: true, ticket: updatedTicket };
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid ticket token');
      }
      throw error;
    }
  }

  signTicketToken(ticketId: string, eventId: string) {
    return jwt.sign({ ticketId, eventId }, this.JWT_SECRET);
  }

  async getTicket(ticketId: string) {
    return this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { event: true, transaction: true },
    });
  }

  async refundTicket(ticketId: string, user: any) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { event: true, transaction: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // RBAC: Only SUPER_ADMIN or the ORGANIZER who owns the event
    if (user.role !== 'SUPER_ADMIN') {
      if (user.role !== 'ORGANIZER' || ticket.event.organizerId !== user.id) {
        throw new UnauthorizedException('You do not have permission to refund this ticket');
      }
    }

    if (ticket.status === 'REFUNDED') {
      throw new BadRequestException('Ticket is already refunded');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Update ticket status
      const updatedTicket = await tx.ticket.update({
        where: { id: ticketId },
        data: { status: 'REFUNDED' },
      });

      // 2. Update transaction status
      if (ticket.transaction) {
        await tx.transaction.update({
          where: { id: ticket.transaction.id },
          data: { status: 'FAILED' }, // Or add a REFUNDED status to Transaction if possible
        });
      }

      // 3. Decrement ticketsSold in event
      await tx.event.update({
        where: { id: ticket.eventId },
        data: { ticketsSold: { decrement: 1 } },
      });

      // 4. Decrement totalTicketsSold on the Influencer
      await tx.influencer.update({
        where: { id: ticket.event.organizerId },
        data: { totalTicketsSold: { decrement: 1 } },
      });

      return updatedTicket;
    });
  }
}
