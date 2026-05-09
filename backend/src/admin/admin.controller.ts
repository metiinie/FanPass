import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  async getGlobalStats() {
    const totalEvents = await this.prisma.event.count();
    const totalTicketsSold = await this.prisma.ticket.count({
      where: { status: { in: ['PAID', 'ISSUED', 'SCANNED'] } },
    });
    const totalRevenue = await this.prisma.transaction.aggregate({
      where: { status: 'CONFIRMED' },
      _sum: { amount: true },
    });
    const totalOrganizers = await this.prisma.organizer.count();

    return {
      success: true,
      data: {
        totalEvents,
        totalTicketsSold,
        totalRevenue: totalRevenue._sum.amount || 0,
        totalOrganizers,
      },
    };
  }

  @Get('organizers')
  async getAllOrganizers() {
    const organizers = await this.prisma.organizer.findMany({
      include: {
        _count: {
          select: { events: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: organizers,
    };
  }

  @Patch('organizers/:id/status')
  async toggleOrganizerStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    const organizer = await this.prisma.organizer.update({
      where: { id },
      data: { isActive },
    });

    return {
      success: true,
      message: `Organizer ${organizer.name} has been ${isActive ? 'activated' : 'suspended'}.`,
      data: organizer,
    };
  }

  @Get('events')
  async getAllEvents() {
    const events = await this.prisma.event.findMany({
      include: {
        organizer: {
          select: { name: true, phone: true },
        },
        _count: {
          select: { tickets: true },
        },
      },
      orderBy: { dateTime: 'desc' },
    });

    return {
      success: true,
      data: events,
    };
  }
}
