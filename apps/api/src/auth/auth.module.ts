import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { User, Session, EmailVerificationToken, PasswordResetToken, Organization, Membership } from '../database/entities';

const hasDb = Boolean(process.env.DATABASE_URL || process.env.DB_HOST || process.env.DB_NAME);

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    ...(hasDb ? [TypeOrmModule.forFeature([User, Session, EmailVerificationToken, PasswordResetToken, Organization, Membership])] : []),
  ],
  controllers: hasDb ? [AuthController] : [],
  providers: hasDb ? [AuthService, JwtAccessStrategy, JwtRefreshStrategy] : [],
  exports: hasDb ? [AuthService] : [],
})
export class AuthModule {}
