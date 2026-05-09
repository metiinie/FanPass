import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async sendOtp(phone: string) {
    // 1. Rate Limiting: max 3 attempts per phone per 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentAttempts = await this.prisma.otpCode.count({
      where: {
        phone,
        createdAt: { gt: tenMinutesAgo },
      },
    });

    if (recentAttempts >= 3) {
      throw new UnauthorizedException('Too many attempts. Please try again later.');
    }

    // 2. Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // 3. Save to DB
    await this.prisma.otpCode.create({
      data: {
        phone,
        code,
        expiresAt,
      },
    });

    // 4. Send SMS (Simulation Mode)
    // TODO: Integrate Africa's Talking API here
    console.log(`[SIMULATION] Sending OTP ${code} to ${phone}`);

    return { success: true, message: 'OTP sent successfully' };
  }

  async verifyOtp(phone: string, code: string) {

    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        phone,
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

    const organizer = await this.prisma.organizer.findUnique({
      where: { phone },
    });

    if (organizer) {
      const payload = {
        id: organizer.id,
        phone: organizer.phone,
        name: organizer.name,
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

    throw new UnauthorizedException('Account not found for this phone number.');
  }
}
