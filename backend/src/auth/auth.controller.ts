import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Backward compatibility for the frontend if it's still calling dev-login
  @Post('dev-login')
  @HttpCode(HttpStatus.OK)
  async devLogin(@Body() body: { email: string; pass: string }) {
    return this.authService.devLogin(body.email, body.pass);
  }

  @Post('send-otp')
  @HttpCode(HttpStatus.GONE) // Indicate it's no longer here
  async sendOtp() {
    return { success: false, message: 'OTP login is deprecated. Please use email/password.' };
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.GONE)
  async verifyOtp() {
    return { success: false, message: 'OTP login is deprecated. Please use email/password.' };
  }
}
