import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TicketsService } from '../tickets/tickets.service';
import * as bcrypt from 'bcrypt';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly ticketsService: TicketsService,
  ) {}

  @Get('stats')
  async getGlobalStats() {
    const totalEvents = await this.prisma.event.count();
    const totalTicketsSold = await this.prisma.ticket.count({
      where: { status: { in: ['ISSUED', 'SCANNED'] } },
    });

    // Calculate revenue from approved tickets
    const approvedTickets = await this.prisma.ticket.findMany({
      where: { verificationStatus: 'VERIFIED' },
      include: { event: { select: { ticketPrice: true } } },
    });
    const totalSalesValue = approvedTickets.reduce((sum, t) => sum + (t.event.ticketPrice * t.ticketCount), 0);

    const totalInfluencers = await this.prisma.influencer.count();

    // Verification stats
    const pendingSubmissions = await this.prisma.ticket.count({
      where: { verificationStatus: { in: ['PENDING_EXTRACTION', 'EXTRACTED_HIGH_CONFIDENCE', 'EXTRACTED_LOW_CONFIDENCE', 'MANUAL_REVIEW_REQUIRED'] } },
    });

    return {
      totalEvents,
      totalTicketsSold,
      totalSalesValue,
      totalInfluencers,
      pendingSubmissions,
    };
  }

  // ── Global Approvals (Super Admin) ─────────────────────────────
  @Get('approvals')
  async getGlobalApprovals(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return await this.ticketsService.getAllSubmissions(
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  @Get('approvals/stats')
  async getGlobalApprovalStats() {
    const [pending, flagged, approved, rejected] = await Promise.all([
      this.prisma.ticket.count({ where: { verificationStatus: 'PENDING_EXTRACTION' } }),
      this.prisma.ticket.count({ where: { verificationStatus: { in: ['EXTRACTED_HIGH_CONFIDENCE', 'EXTRACTED_LOW_CONFIDENCE', 'MANUAL_REVIEW_REQUIRED'] } } }),
      this.prisma.ticket.count({ where: { verificationStatus: 'VERIFIED' } }),
      this.prisma.ticket.count({ where: { verificationStatus: 'REJECTED' } }),
    ]);

    // Average approval time (in minutes)
    const approvedTickets = await this.prisma.ticket.findMany({
      where: { verificationStatus: 'VERIFIED', reviewedAt: { not: null } },
      select: { issuedAt: true, reviewedAt: true },
      take: 100,
      orderBy: { reviewedAt: 'desc' },
    });

    let avgApprovalMinutes = 0;
    if (approvedTickets.length > 0) {
      const totalMs = approvedTickets.reduce((sum, t) => {
        return sum + (new Date(t.reviewedAt!).getTime() - new Date(t.issuedAt).getTime());
      }, 0);
      avgApprovalMinutes = Math.round(totalMs / approvedTickets.length / 60000);
    }

    return {
      pending,
      flagged,
      approved,
      rejected,
      needsReview: pending + flagged,
      avgApprovalMinutes,
    };
  }

  // ── Influencer Management ──────────────────────────────────────
  @Get('influencers')
  async getAllInfluencers() {
    return await this.prisma.influencer.findMany({
      include: {
        _count: { select: { events: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('influencers')
  async createInfluencer(@Body() data: any) {
    const slug = data.slug || data.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    
    // Check if phone or slug already exists
    const existing = await this.prisma.influencer.findFirst({
      where: { OR: [{ phone: data.phone }, { slug }] }
    });

    if (existing) {
      throw new BadRequestException(
        existing.phone === data.phone ? 'Phone number already registered.' : 'Slug/Profile URL already taken.'
      );
    }

    // Hash password if provided, otherwise use a default
    const hashedPassword = await bcrypt.hash(data.password || '123456', 10);

    const influencer = await this.prisma.influencer.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        slug: slug,
        bio: data.bio,
        teamSupported: data.teamSupported,
        teamColor: data.teamColor,
        tiktokUrl: data.tiktokUrl,
        instagramUrl: data.instagramUrl,
        telegramUrl: data.telegramUrl,
        isActive: data.isActive !== undefined ? data.isActive : true,
        isVerified: data.isVerified !== undefined ? data.isVerified : false,
      },
    });

    // Send onboarding SMS
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
    try {
      await this.notificationsService.sendSms(
        influencer.phone,
        `Welcome to FanPass, ${influencer.name}! Your account has been provisioned. Login here: ${loginUrl}`
      );
    } catch (error) {
      this.logger.error('Failed to send onboarding SMS', error instanceof Error ? error.stack : error);
    }

    return influencer;
  }

  @Patch('influencers/:id')
  async updateInfluencer(@Param('id') id: string, @Body() data: any) {
    // If slug is updated, check for uniqueness
    if (data.slug) {
      const existing = await this.prisma.influencer.findFirst({
        where: { slug: data.slug, id: { not: id } }
      });
      if (existing) {
        throw new BadRequestException('Slug already taken.');
      }
    }

    const updateData: any = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      slug: data.slug,
      bio: data.bio,
      teamSupported: data.teamSupported,
      teamColor: data.teamColor,
      tiktokUrl: data.tiktokUrl,
      instagramUrl: data.instagramUrl,
      telegramUrl: data.telegramUrl,
      isActive: data.isActive,
      isVerified: data.isVerified,
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    return await this.prisma.influencer.update({
      where: { id },
      data: updateData,
    });
  }

  @Delete('influencers/:id')
  async deleteInfluencer(@Param('id') id: string) {
    // Check for ticket history
    const ticketCount = await this.prisma.ticket.count({
      where: {
        event: { organizerId: id },
        status: { in: ['ISSUED', 'SCANNED'] },
      },
    });

    if (ticketCount > 0) {
      throw new BadRequestException('Cannot delete influencer with ticket sales history. Use deactivation (suspension) instead to preserve records.');
    }

    // If no history, allow hard delete
    await this.prisma.influencer.delete({ where: { id } });
    return { message: 'Influencer account permanently deleted.' };
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

    // If deactivated, cancel upcoming events and notify buyers
    if (!isActive) {
      const now = new Date();
      const upcomingEvents = await this.prisma.event.findMany({
        where: {
          organizerId: id,
          dateTime: { gte: now },
          status: 'ACTIVE',
        },
        include: {
          tickets: {
            where: { status: { in: ['ISSUED'] } },
            select: { buyerPhone: true },
          },
        },
      });

      for (const event of upcomingEvents) {
        // 1. Cancel Event
        await this.prisma.event.update({
          where: { id: event.id },
          data: { status: 'CANCELLED' },
        });

        // 2. Notify Buyers
        const phones = [...new Set(event.tickets.map((t) => t.buyerPhone))];
        for (const phone of phones) {
          await this.notificationsService.sendSms(
            phone,
            `Notice: The event "${event.title}" has been cancelled. Please contact the organizer for further details regarding your payment.`
          );
        }
      }
    }

    return influencer;
  }

  @Patch('influencers/:id/verify')
  async verifyInfluencer(@Param('id') id: string) {
    return await this.prisma.influencer.update({
      where: { id },
      data: { isVerified: true },
    });
  }

  // ── Events Management ──────────────────────────────────────────
  @Get('events')
  async getAllEvents() {
    return await this.prisma.event.findMany({
      include: {
        influencer: { select: { name: true, phone: true, slug: true } },
        _count: { select: { tickets: true } },
      },
      orderBy: { dateTime: 'desc' },
    });
  }

  @Get('tickets')
  async getAllTickets() {
    return await this.prisma.ticket.findMany({
      include: {
        event: { select: { title: true, ticketPrice: true, currency: true } },
      },
      orderBy: { issuedAt: 'desc' },
      take: 100,
    });
  @Get('test-ai')
  async testAI() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return { success: false, message: 'GEMINI_API_KEY is missing' };

      const GoogleGenAIModule = await import('@google/genai');
      const GoogleGenAI = GoogleGenAIModule.GoogleGenAI;
      const ai = new GoogleGenAI({ apiKey });
      
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent('Hello, are you active? Respond with "ACTIVE" and your version.');
      const response = await result.response;
      
      return { 
        success: true, 
        message: 'Gemini AI is configured correctly.',
        response: response.text()
      };
    } catch (error: any) {
      this.logger.error('AI Test failed:', error.message);
      return { success: false, error: error.message };
    }
  }

}
