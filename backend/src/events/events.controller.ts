import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
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
  async getPublicEvents() {
    return this.eventsService.getPublicEvents();
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
  @Roles('ORGANIZER')
  @Get()
  async getMyEvents(@Request() req) {
    return this.eventsService.getEventsByOrganizer(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER')
  @Get(':id')
  async getEventById(@Request() req, @Param('id') id: string) {
    return this.eventsService.getEventById(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER')
  @Get(':id/stats')
  async getEventStats(@Request() req, @Param('id') id: string) {
    return this.eventsService.getEventStats(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER')
  @Patch(':id')
  async updateEventStatus(@Request() req, @Param('id') id: string, @Body() body: UpdateEventStatusDto) {
    return this.eventsService.updateEventStatus(id, req.user.id, body.status);
  }
}
