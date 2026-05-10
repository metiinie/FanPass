import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InfluencersService } from './influencers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { v2 as cloudinary } from 'cloudinary';

@Controller('influencers')
export class InfluencersController {
  constructor(private readonly influencersService: InfluencersService) {}

  // ── Public Routes ─────────────────────────────────────────

  @Get()
  async getAll(@Query('search') search?: string) {
    return this.influencersService.getAll(search);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER')
  async getMyProfile(@Request() req) {
    return this.influencersService.getMyProfile(req.user.id);
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.influencersService.getBySlug(slug);
  }

  @Get(':slug/events')
  async getEvents(@Param('slug') slug: string) {
    return this.influencersService.getEventsBySlug(slug);
  }

  // ── Protected Routes (Influencer only) ───────────────────

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER')
  async updateMyProfile(@Request() req, @Body() body: any) {
    return this.influencersService.updateMyProfile(req.user.id, body);
  }

  // ── Cloudinary Upload Signature ───────────────────────────
  // Frontend requests a signed upload URL from Cloudinary.
  // The actual file is uploaded directly from the browser to Cloudinary
  // (no file bytes pass through our server), keeping our server stateless.
  @Post('upload-signature')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER')
  async getUploadSignature() {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'fanpass/influencers';

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET || '',
    );

    return {
      timestamp,
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
    };
  }
}
