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
    const totalRevenueSum = await this.prisma.transaction.aggregate({
      where: { status: 'CONFIRMED' },
      _sum: { amount: true },
    });

    const settings = await this.prisma.platformSettings.findUnique({
      where: { id: 'global' },
    });

    const gmv = totalRevenueSum._sum.amount || 0;
    const commissionRate = settings?.commissionRate || 0.1;
    const totalCommission = gmv * commissionRate;
    const totalInfluencers = await this.prisma.influencer.count();

    return {
      success: true,
      data: {
        totalEvents,
        totalTicketsSold,
        totalRevenue: gmv,
        totalCommission,
        totalInfluencers,
      },
    };
  }

  // ── Influencer Management ──────────────────────────────────
  @Get('influencers')
  async getAllInfluencers() {
    const influencers = await this.prisma.influencer.findMany({
      include: {
        _count: { select: { events: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: influencers };
  }

  @Post('influencers')
  async createInfluencer(@Body() data: any) {
    const slug = data.slug || data.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    
    // Check if phone or slug already exists
    const existing = await this.prisma.influencer.findFirst({
      where: { OR: [{ phone: data.phone }, { slug }] }
    });

    if (existing) {
      return { 
        success: false, 
        message: existing.phone === data.phone ? 'Phone number already registered.' : 'Slug/Profile URL already taken.' 
      };
    }

    const influencer = await this.prisma.influencer.create({
      data: {
        ...data,
        slug,
      },
    });
    return { success: true, message: 'Influencer onboarded.', data: influencer };
  }

  @Patch('influencers/:id')
  async updateInfluencer(@Param('id') id: string, @Body() data: any) {
    // If slug is updated, check for uniqueness
    if (data.slug) {
      const existing = await this.prisma.influencer.findFirst({
        where: { slug: data.slug, id: { not: id } }
      });
      if (existing) {
        return { success: false, message: 'Slug already taken.' };
      }
    }

    const influencer = await this.prisma.influencer.update({
      where: { id },
      data,
    });
    return { success: true, message: 'Influencer profile updated.', data: influencer };
  }

  @Delete('influencers/:id')
  async deleteInfluencer(@Param('id') id: string) {
    // Soft delete as agreed
    const influencer = await this.prisma.influencer.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true, message: 'Influencer account suspended.', data: influencer };
  }

  @Patch('influencers/:id/status')
  async toggleInfluencerStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    const influencer = await this.prisma.influencer.update({
      where: { id },
      data: { isActive },
    });
    return {
      success: true,
      message: `${influencer.name} has been ${isActive ? 'activated' : 'suspended'}.`,
      data: influencer,
    };
  }

  @Patch('influencers/:id/verify')
  async verifyInfluencer(@Param('id') id: string) {
    const influencer = await this.prisma.influencer.update({
      where: { id },
      data: { isVerified: true },
    });
    return {
      success: true,
      message: `${influencer.name} is now verified.`,
      data: influencer,
    };
  }

  // ── Events Management ──────────────────────────────────────
  @Get('events')
  async getAllEvents() {
    const events = await this.prisma.event.findMany({
      include: {
        influencer: { select: { name: true, phone: true, slug: true } },
        _count: { select: { tickets: true } },
      },
      orderBy: { dateTime: 'desc' },
    });
    return { success: true, data: events };
  }

  @Get('tickets')
  async getAllTickets() {
    const tickets = await this.prisma.ticket.findMany({
      include: {
        event: { select: { title: true } },
        transaction: true,
      },
      orderBy: { issuedAt: 'desc' },
      take: 100,
    });
    return { success: true, data: tickets };
  }

  @Get('transactions')
  async getAllTransactions() {
    const transactions = await this.prisma.transaction.findMany({
      include: {
        ticket: { include: { event: { select: { title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { success: true, data: transactions };
  }

  // ── Platform Settings ──────────────────────────────────────
  @Get('settings')
  async getSettings() {
    let settings = await this.prisma.platformSettings.findUnique({
      where: { id: 'global' },
    });
    if (!settings) {
      settings = await this.prisma.platformSettings.create({
        data: { id: 'global' },
      });
    }
    return { success: true, data: settings };
  }

  @Patch('settings')
  async updateSettings(@Body() data: any) {
    const settings = await this.prisma.platformSettings.upsert({
      where: { id: 'global' },
      update: data,
      create: { ...data, id: 'global' },
    });
    return { success: true, message: 'Platform settings updated.', data: settings };
  }
}
