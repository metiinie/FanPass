import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async createStaff(organizerId: string, userRole: string, data: any) {
    const existing = await this.prisma.staff.findFirst({
      where: { phone: data.phone },
    });

    if (existing) {
      throw new ConflictException('Staff with this phone already exists');
    }

    // If Super Admin, they must provide an organizerId in data, or it defaults to null (needs schema update)
    // For now, we assume they specify an organizerId if they are Super Admin
    const targetOrganizerId = userRole === 'SUPER_ADMIN' ? (data.organizerId || organizerId) : organizerId;

    return this.prisma.staff.create({
      data: {
        name: data.name,
        phone: data.phone,
        organizerId: targetOrganizerId,
      },
    });
  }

  async getStaffByOrganizer(organizerId: string, userRole: string) {
    if (userRole === 'SUPER_ADMIN') {
      return this.prisma.staff.findMany({
        include: {
          assignments: {
            include: {
              event: true,
            },
          },
          organizer: true,
        },
      });
    }
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

  async assignEvent(organizerId: string, userRole: string, eventId: string, staffId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (userRole !== 'SUPER_ADMIN' && event.organizerId !== organizerId) {
      throw new UnauthorizedException('Unauthorized access to event');
    }

    return this.prisma.eventStaff.create({
      data: {
        eventId,
        staffId,
      },
    });
  }

  async unassignEvent(organizerId: string, userRole: string, eventId: string, staffId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (userRole !== 'SUPER_ADMIN' && event.organizerId !== organizerId) {
      throw new UnauthorizedException('Unauthorized access to event');
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
