import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { InitiateTicketDto } from './dto/initiate-ticket.dto';
import { ValidateTicketDto } from './dto/validate-ticket.dto';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('initiate')
  async initiate(@Body() body: InitiateTicketDto) {
    return this.ticketsService.initiateTicket(body);
  }

  @Get(':id')
  async getTicket(@Param('id') id: string) {
    return this.ticketsService.getTicket(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'ORGANIZER', 'SUPER_ADMIN')
  @Post('validate')
  async validate(@Request() req, @Body() body: ValidateTicketDto) {
    return this.ticketsService.validateTicket(body.eventId, req.user, body.token);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @Post(':id/refund')
  async refund(@Request() req, @Param('id') id: string) {
    return this.ticketsService.refundTicket(id, req.user);
  }
}
