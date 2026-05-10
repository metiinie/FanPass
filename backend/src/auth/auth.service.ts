import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private normalizePhone(phone: string): string {
    let clean = phone.replace(/\s+/g, '');
    if (clean.startsWith('09')) {
      return '+2519' + clean.substring(2);
    }
    if (clean.startsWith('07')) {
      return '+2517' + clean.substring(2);
    }
    return clean;
  }

  async sendOtp(phone: string) {
    const normalizedPhone = this.normalizePhone(phone);
    // Rate Limiting: max 3 attempts per phone per 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentAttempts = await this.prisma.otpCode.count({
      where: {
        phone: normalizedPhone,
        createdAt: { gt: tenMinutesAgo },
      },
    });

    if (recentAttempts >= 3) {
      throw new UnauthorizedException('Too many attempts. Please try again later.');
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.otpCode.create({
      data: { phone: normalizedPhone, code, expiresAt },
    });

    // TODO: Integrate Africa's Talking API here
    console.log(`[SIMULATION] Sending OTP ${code} to ${normalizedPhone}`);

    return { success: true, message: 'OTP sent successfully' };
  }

  async verifyOtp(phone: string, code: string) {
    const normalizedPhone = this.normalizePhone(phone);
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        phone: normalizedPhone,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('Invalid or expired OTP.');
    }

    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Check Super Admin first
    const superAdmin = await this.prisma.superAdmin.findUnique({
      where: { phone: normalizedPhone },
    });

    if (superAdmin) {
      const payload = {
        id: superAdmin.id,
        phone: superAdmin.phone,
        name: superAdmin.name,
        role: 'SUPER_ADMIN',
      };
      return {
        user: payload,
        accessToken: this.jwtService.sign(payload),
      };
    }

    // Check Influencer (formerly Organizer — role string stays 'ORGANIZER')
    const influencer = await this.prisma.influencer.findUnique({
      where: { phone: normalizedPhone },
    });

    if (influencer) {
      if (!influencer.isActive) {
        throw new UnauthorizedException('Account is suspended. Please contact support.');
      }
      const payload = {
        id: influencer.id,
        phone: influencer.phone,
        name: influencer.name,
        role: 'ORGANIZER', // role string unchanged for backward compat with guards
        slug: influencer.slug,
      };
      return {
        user: payload,
        accessToken: this.jwtService.sign(payload),
      };
    }

    // Check Staff
    const staff = await this.prisma.staff.findFirst({
      where: { phone: normalizedPhone },
      include: { influencer: true },
    });

    if (staff) {
      if (staff.influencer && !staff.influencer.isActive) {
        throw new UnauthorizedException('Organizer account is suspended.');
      }
      const payload = {
        id: staff.id,
        phone: staff.phone,
        name: staff.name,
        role: 'STAFF',
        organizerId: staff.organizerId,
      };
      return {
        user: payload,
        accessToken: this.jwtService.sign(payload),
      };
    }

    throw new UnauthorizedException('Account not found for this phone number.');
  }
}
