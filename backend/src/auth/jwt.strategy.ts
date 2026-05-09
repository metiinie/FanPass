import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-12345',
    });
  }

  async validate(payload: any) {
    return {
      id: payload.id,
      phone: payload.phone,
      name: payload.name,
      role: payload.role,
      organizerId: payload.organizerId,
    };
  }
}
