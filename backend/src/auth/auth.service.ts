import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from '../notifications/notifications.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    this.logger.log(`[AUTH] Login attempt for ${email}`);

    // 1. Check Super Admin
    const superAdmin = await this.prisma.superAdmin.findUnique({
      where: { email },
    });

    if (superAdmin) {
      const isPasswordValid = await bcrypt.compare(password, superAdmin.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials.');
      }

      const payload = {
        id: superAdmin.id,
        phone: superAdmin.phone,
        email: superAdmin.email,
        name: superAdmin.name,
        role: 'SUPER_ADMIN',
      };
      return {
        user: payload,
        accessToken: this.jwtService.sign(payload),
      };
    }

    // 2. Check Influencer (Organizer)
    const influencer = await this.prisma.influencer.findUnique({
      where: { email },
    });

    if (influencer) {
      if (!influencer.isActive) {
        throw new UnauthorizedException('Account is suspended. Please contact support.');
      }

      const isPasswordValid = await bcrypt.compare(password, influencer.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials.');
      }

      const payload = {
        id: influencer.id,
        phone: influencer.phone,
        email: influencer.email,
        name: influencer.name,
        role: 'ORGANIZER',
        slug: influencer.slug,
      };
      return {
        user: payload,
        accessToken: this.jwtService.sign(payload),
      };
    }

    // 3. Check Staff
    const staff = await this.prisma.staff.findUnique({
      where: { email },
      include: { influencer: true },
    });

    if (staff) {
      if (staff.influencer && !staff.influencer.isActive) {
        throw new UnauthorizedException('Organizer account is suspended.');
      }

      const isPasswordValid = await bcrypt.compare(password, staff.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials.');
      }

      const payload = {
        id: staff.id,
        phone: staff.phone,
        email: staff.email,
        name: staff.name,
        role: 'STAFF',
        organizerId: staff.organizerId,
      };
      return {
        user: payload,
        accessToken: this.jwtService.sign(payload),
      };
    }

    throw new UnauthorizedException('Account not found with this email.');
  }

  // Deprecated / Legacy Support if needed, but per request we are removing it.
  async sendOtp(phone: string) {
    throw new UnauthorizedException('OTP login is no longer supported. Please use email and password.');
  }

  async verifyOtp(phone: string, code: any) {
    throw new UnauthorizedException('OTP login is no longer supported. Please use email and password.');
  }

  async devLogin(email: string, pass: string) {
    // Keep it for backward compat during migration but call the new login
    return this.login({ email, password: pass });
  }
}
