import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicEvents() {
    return this.prisma.event.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { dateTime: 'asc' },
      take: 12,
    });
  }

  async createEvent(organizerId: string, data: any) {
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return this.prisma.event.create({
      data: {
        ...data,
        slug,
        organizerId,
      },
    });
  }

  async getEventsByOrganizer(organizerId: string) {
    return this.prisma.event.findMany({
      where: { organizerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEventById(id: string, organizerId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });
    if (!event || event.organizerId !== organizerId) {
      throw new NotFoundException('Event not found or unauthorized');
    }
    return event;
  }

  async getEventStats(eventId: string, organizerId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        staffAssignments: {
          include: { staff: true },
        },
      },
    });

    if (!event || event.organizerId !== organizerId) {
      throw new NotFoundException('Event not found or unauthorized');
    }

    const recentScans = await this.prisma.scanLog.findMany({
      where: { eventId },
      orderBy: { scannedAt: 'desc' },
      take: 50,
      include: {
        ticket: true,
        staff: true,
      },
    });

    // Revenue = number of paid/used tickets × event ticket price
    const paidTicketCount = await this.prisma.ticket.count({
      where: { eventId, status: { in: ['ISSUED', 'SCANNED'] } },
    });
    const totalRevenue = paidTicketCount * event.ticketPrice;

    const attendeesEntered = await this.prisma.scanLog.count({
      where: { eventId },
    });

    return {
      ticketsSold: event.ticketsSold,
      maxCapacity: event.maxCapacity,
      attendeesEntered,
      eventStatus: event.status,
      totalRevenue,
      staff: event.staffAssignments.map((es) => ({
        id: es.staff.id,
        name: es.staff.name,
      })),
      recentScans: recentScans.map((s) => ({
        id: s.id,
        scannedAt: s.scannedAt,
        buyerPhone: s.ticket.buyerPhone,
        staffName: s.staff.name,
        result: s.result,
      })),
    };
  }

  async updateEventStatus(eventId: string, organizerId: string, status: any) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event || event.organizerId !== organizerId) {
      throw new NotFoundException('Event not found or unauthorized');
    }

    // Validation for transitions
    if (status === 'ACTIVE') {
      if (event.ticketPrice <= 0) {
        throw new BadRequestException('Cannot activate an event with a zero ticket price.');
      }
      if (!event.venue || event.venue.trim().length === 0) {
        throw new BadRequestException('Cannot activate an event without a valid venue.');
      }
    }

    if (status === 'SOLD_OUT') {
      if (event.ticketsSold < event.maxCapacity) {
        throw new BadRequestException('Cannot mark as sold out when capacity is still available.');
      }
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: { status },
    });
  }

  async getEventBySlug(slug: string) {
    const event = await this.prisma.event.findUnique({
      where: { slug },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }
}
