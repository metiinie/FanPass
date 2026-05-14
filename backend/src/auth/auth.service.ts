import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private normalizePhone(phone: string): string {
    let clean = phone.replace(/[^0-9+]/g, '');
    if (clean.startsWith('09')) {
      return '+2519' + clean.substring(2);
    }
    if (clean.startsWith('07')) {
      return '+2517' + clean.substring(2);
    }
    if (clean.length === 9 && (clean.startsWith('9') || clean.startsWith('7'))) {
      return '+251' + clean;
    }
    if (clean.startsWith('251')) {
      return '+' + clean;
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

    await this.notificationsService.sendSms(
      normalizedPhone,
      `Your FanPass verification code is: ${code}. Valid for 10 minutes.`
    );

    return { success: true, message: 'OTP sent successfully' };
  }

  async verifyOtp(phone: string, code: any) {
    const normalizedPhone = this.normalizePhone(phone);
    const codeStr = String(code || '').trim();
    
    this.logger.log(`[AUTH] Login attempt for ${normalizedPhone} with code ${codeStr}`);

    // DEV BYPASS: Bulletproof check for development
    if (codeStr === '000000' || codeStr.includes('000000')) {
      this.logger.log(`[DEV BYPASS] SUCCESS for ${normalizedPhone}`);
    } else {
      const otpRecord = await this.prisma.otpCode.findFirst({
        where: {
          phone: normalizedPhone,
          code: codeStr,
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
    }

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

  async devLogin(email: string, pass: string) {
    if (pass !== '123456') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const emailToPhoneMap: Record<string, string> = {
      'superawol@gmail.com': '+251918982161',
      'influencer@gmail.com': '+251718280155',
      'awolstaff@gmail.com': '+251918982122',
    };

    const phone = emailToPhoneMap[email];
    if (!phone) {
      throw new UnauthorizedException('Email not recognized in dev mode');
    }

    // Bypass OTP check and directly resolve user payload
    const superAdmin = await this.prisma.superAdmin.findUnique({
      where: { phone },
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

    const influencer = await this.prisma.influencer.findUnique({
      where: { phone },
    });

    if (influencer) {
      const payload = {
        id: influencer.id,
        phone: influencer.phone,
        name: influencer.name,
        role: 'ORGANIZER',
      };
      return {
        user: payload,
        accessToken: this.jwtService.sign(payload),
      };
    }

    const staff = await this.prisma.staff.findFirst({
      where: { phone },
    });

    if (staff) {
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

    throw new UnauthorizedException('User not found in DB');
  }
}
