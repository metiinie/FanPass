import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('public')
  async getPublicEvents(
    @Query('team') team?: string,
    @Query('competition') competition?: string,
    @Query('city') city?: string,
    @Query('influencerId') influencerId?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.eventsService.getPublicEvents({
      team,
      competition,
      city,
      influencerId,
      search,
      dateFrom,
      dateTo,
      take: take ? parseInt(take) : 20,
      skip: skip ? parseInt(skip) : 0,
    });
  }

  @Get('public/:slug')
  async getEventBySlug(@Param('slug') slug: string) {
    return this.eventsService.getEventBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER')
  @Post()
  async createEvent(@Request() req, @Body() body: CreateEventDto) {
    return this.eventsService.createEvent(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @Get()
  async getMyEvents(@Request() req) {
    return this.eventsService.getEventsByOrganizer(req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @Get(':id')
  async getEventById(@Request() req, @Param('id') id: string) {
    return this.eventsService.getEventById(id, req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @Get(':id/stats')
  async getEventStats(@Request() req, @Param('id') id: string) {
    return this.eventsService.getEventStats(id, req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @Patch(':id')
  async updateEvent(
    @Request() req,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    if (body.status && Object.keys(body).length === 1) {
      // Compatibility with existing status-only updates
      return this.eventsService.updateEventStatus(id, req.user.id, req.user.role, body.status);
    }
    return this.eventsService.updateEvent(id, req.user.id, req.user.role, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @Post(':id/cancel')
  async cancel(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { refundPolicy: string, organizerContact: string },
  ) {
    return this.eventsService.cancelEvent(id, req.user.id, req.user.role, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @Delete(':id')
  async deleteEvent(@Request() req, @Param('id') id: string) {
    return this.eventsService.deleteEvent(id, req.user.id, req.user.role);
  }
}
