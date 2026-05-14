import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SubmitTicketDto } from './dto/submit-ticket.dto';
import { ValidateTicketDto } from './dto/validate-ticket.dto';
import { RejectTicketDto } from './dto/reject-ticket.dto';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // ─── Fan submits receipt + registration ─────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('submit')
  async submit(@Body() body: SubmitTicketDto) {
    return this.ticketsService.submitTicket(body);
  }

  // ─── Fan polls for ticket status ────────────────────────────────
  @Get(':id/status')
  async getStatus(@Param('id') id: string) {
    return this.ticketsService.getTicketStatus(id);
  }

  // ─── Fan resubmits after rejection ──────────────────────────────
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post(':id/resubmit')
  async resubmit(
    @Param('id') id: string,
    @Body() body: { screenshotBase64: string; mimeType: string; note?: string },
  ) {
    return this.ticketsService.resubmitTicket(id, body);
  }

  // ─── Get full ticket (public ticket page) ───────────────────────
  @Get(':id')
  async getTicket(@Param('id') id: string) {
    return this.ticketsService.getTicket(id);
  }

  // ─── Organizer/Admin approves a ticket ──────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @Post(':id/approve')
  async approve(@Request() req, @Param('id') id: string) {
    return this.ticketsService.approveTicket(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @Post(':id/resend-sms')
  async resendSms(@Request() req, @Param('id') id: string) {
    return this.ticketsService.resendSms(id, req.user.id);
  }

  // ─── Organizer/Admin rejects a ticket ───────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @Post(':id/reject')
  async reject(
    @Request() req,
    @Param('id') id: string,
    @Body() body: RejectTicketDto,
  ) {
    return this.ticketsService.rejectTicket(id, req.user.id, body.reason);
  }

  // ─── Get submissions for an event (approval dashboard) ─────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @Get('events/:eventId/submissions')
  async getSubmissions(
    @Param('eventId') eventId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ticketsService.getEventSubmissions(
      eventId,
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  // ─── Get submission stats for an event ──────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @Get('events/:eventId/submission-stats')
  async getSubmissionStats(@Param('eventId') eventId: string) {
    return this.ticketsService.getSubmissionStats(eventId);
  }

  // ─── Check duplicate phone for an event ─────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @Get('events/:eventId/check-phone/:phone')
  async checkDuplicatePhone(
    @Param('eventId') eventId: string,
    @Param('phone') phone: string,
  ) {
    return this.ticketsService.checkDuplicatePhone(eventId, phone);
  }

  // ─── UNCHANGED: Validate ticket (door scan) ────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'ORGANIZER', 'SUPER_ADMIN')
  @Post('validate')
  async validate(@Request() req, @Body() body: ValidateTicketDto) {
    return this.ticketsService.validateTicket(body.eventId, req.user, body.token);
  }



  // ─── UNCHANGED: Offline sync ───────────────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'ORGANIZER', 'SUPER_ADMIN')
  @Post('sync/:eventId')
  async syncOffline(
    @Request() req,
    @Param('eventId') eventId: string,
    @Body('scans') scans: any[],
  ) {
    return this.ticketsService.syncOfflineScans(eventId, req.user, scans);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'ORGANIZER', 'SUPER_ADMIN')
  @Get('sync/:eventId')
  async getSyncManifest(@Request() req, @Param('eventId') eventId: string) {
    return this.ticketsService.getSyncManifest(eventId, req.user);
  }
}
