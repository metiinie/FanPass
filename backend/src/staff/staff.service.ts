import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async createStaff(organizerId: string, data: any) {
    const existing = await this.prisma.staff.findFirst({
      where: { phone: data.phone },
    });

    if (existing) {
      throw new ConflictException('Staff with this phone already exists');
    }

    return this.prisma.staff.create({
      data: {
        ...data,
        organizerId,
      },
    });
  }

  async getStaffByOrganizer(organizerId: string) {
    return this.prisma.staff.findMany({
      where: { organizerId },
      include: {
        assignments: {
          include: {
            event: true,
          },
        },
      },
    });
  }

  async assignEvent(organizerId: string, eventId: string, staffId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event || event.organizerId !== organizerId) {
      throw new NotFoundException('Event not found or unauthorized');
    }

    return this.prisma.eventStaff.create({
      data: {
        eventId,
        staffId,
      },
    });
  }

  async unassignEvent(organizerId: string, eventId: string, staffId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event || event.organizerId !== organizerId) {
      throw new NotFoundException('Event not found or unauthorized');
    }

    await this.prisma.eventStaff.delete({
      where: {
        eventId_staffId: {
          eventId,
          staffId,
        },
      },
    });

    return { success: true };
  }

  async getMyAssignments(staffId: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        assignments: {
          include: {
            event: {
              select: { id: true, title: true, status: true },
            },
          },
        },
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    return staff.assignments.filter((a) => a.event.status === 'ACTIVE');
  }
}
