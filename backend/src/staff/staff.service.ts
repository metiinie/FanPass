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

    const targetOrganizerId =
      userRole === 'SUPER_ADMIN' ? data.organizerId || organizerId : organizerId;

    return this.prisma.$transaction(async (tx) => {
      const staff = await tx.staff.create({
        data: {
          name: data.name,
          phone: data.phone,
          organizerId: targetOrganizerId,
        },
      });

      if (data.eventId) {
        await tx.eventStaff.create({
          data: { eventId: data.eventId, staffId: staff.id },
        });
      }

      return staff;
    });
  }

  async getStaffByOrganizer(organizerId: string, userRole: string) {
    if (userRole === 'SUPER_ADMIN') {
      return this.prisma.staff.findMany({
        include: {
          assignments: { include: { event: true } },
          influencer: { select: { name: true } },
        },
      });
    }
    return this.prisma.staff.findMany({
      where: { organizerId },
      include: {
        assignments: { include: { event: true } },
      },
    });
  }

  async assignEvent(organizerId: string, userRole: string, eventId: string, staffId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    if (userRole !== 'SUPER_ADMIN' && event.organizerId !== organizerId) {
      throw new UnauthorizedException('Unauthorized access to event');
    }
    return this.prisma.eventStaff.create({ data: { eventId, staffId } });
  }

  async unassignEvent(organizerId: string, userRole: string, eventId: string, staffId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    if (userRole !== 'SUPER_ADMIN' && event.organizerId !== organizerId) {
      throw new UnauthorizedException('Unauthorized access to event');
    }

    await this.prisma.eventStaff.delete({
      where: { eventId_staffId: { eventId, staffId } },
    });

    return { success: true };
  }

  async getMyAssignments(staffId: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        assignments: {
          include: {
            event: { select: { id: true, title: true, status: true } },
          },
        },
      },
    });

    if (!staff) throw new NotFoundException('Staff not found');
    return staff.assignments.filter((a) => a.event.status === 'ACTIVE' || a.event.status === 'DRAFT');
  }

  async getMyScans(staffId: string) {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    return this.prisma.scanLog.findMany({
      where: { staffId, scannedAt: { gt: twelveHoursAgo } },
      include: {
        event: { select: { title: true } },
        ticket: { select: { buyerPhone: true, buyerName: true } },
      },
      orderBy: { scannedAt: 'desc' },
    });
  }
  
  async updateStaff(organizerId: string, userRole: string, staffId: string, data: any) {
    const staff = await this.prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) throw new NotFoundException('Staff not found');
    if (userRole !== 'SUPER_ADMIN' && staff.organizerId !== organizerId) {
      throw new UnauthorizedException('Unauthorized access to staff');
    }
    
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.staff.update({
        where: { id: staffId },
        data: {
          name: data.name,
          phone: data.phone,
        },
      });

      if (data.eventId) {
        // Upsert assignment (ignore if already assigned)
        await tx.eventStaff.upsert({
          where: {
            eventId_staffId: { eventId: data.eventId, staffId: staffId }
          },
          update: {},
          create: { eventId: data.eventId, staffId: staffId }
        });
      }

      return updated;
    });
  }

  async deleteStaff(organizerId: string, userRole: string, staffId: string) {
    const staff = await this.prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) throw new NotFoundException('Staff not found');
    if (userRole !== 'SUPER_ADMIN' && staff.organizerId !== organizerId) {
      throw new UnauthorizedException('Unauthorized access to staff');
    }
    
    await this.prisma.staff.delete({ where: { id: staffId } });
    return { success: true };
  }
}
