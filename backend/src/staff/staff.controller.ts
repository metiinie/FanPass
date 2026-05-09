import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateStaffDto } from './dto/create-staff.dto';

@Controller()
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @Post('staff')
  async createStaff(@Request() req, @Body() body: CreateStaffDto) {
    return this.staffService.createStaff(req.user.id, req.user.role, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @Get('staff')
  async getStaff(@Request() req) {
    return this.staffService.getStaffByOrganizer(req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @Post('events/:eventId/staff/:staffId')
  async assignStaff(@Request() req, @Param('eventId') eventId: string, @Param('staffId') staffId: string) {
    return this.staffService.assignEvent(req.user.id, req.user.role, eventId, staffId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @Delete('events/:eventId/staff/:staffId')
  async unassignStaff(@Request() req, @Param('eventId') eventId: string, @Param('staffId') staffId: string) {
    return this.staffService.unassignEvent(req.user.id, req.user.role, eventId, staffId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF')
  @Get('staff/me/assignments')
  async getMyAssignments(@Request() req) {
    return this.staffService.getMyAssignments(req.user.id);
  }
}
