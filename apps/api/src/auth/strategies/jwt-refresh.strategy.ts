import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from './jwt-access.strategy';

function cookieExtractor(req: Request): string | null {
  return req?.cookies?.refresh_token || null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor, ExtractJwt.fromBodyField('refreshToken')]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET', 'change-me-refresh-secret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    if (payload.type !== 'refresh') throw new UnauthorizedException('Invalid token type');
    const token = req?.cookies?.refresh_token || req?.body?.refreshToken;
    return { id: payload.sub, email: payload.email, refreshToken: token };
  }
}
