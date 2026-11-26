import { Controller, Post, Body, Get, UseGuards, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto } from './dto';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { CurrentUser, AuthUser } from './decorators/current-user.decorator';

const refreshCookieOptions = (secure: boolean) => ({
  httpOnly: true,
  secure,
  sameSite: 'lax' as const,
  path: '/auth',
  maxAge: 7 * 24 * 3600 * 1000,
});

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private setRefreshCookie(res: Response, token: string) {
    const secure = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
    res.cookie('refresh_token', token, refreshCookieOptions(secure));
  }

  private clearRefreshCookie(res: Response) {
    const secure = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
    res.clearCookie('refresh_token', { ...refreshCookieOptions(secure), maxAge: 0 });
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.register(dto, { userAgent: req.headers['user-agent'], ip: req.ip });
    this.setRefreshCookie(res, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken, expiresIn: result.expiresIn };
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto, { userAgent: req.headers['user-agent'], ip: req.ip });
    this.setRefreshCookie(res, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken, expiresIn: result.expiresIn };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@CurrentUser() user: AuthUser & { refreshToken: string }, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.refresh(user.id, user.refreshToken, { userAgent: req.headers['user-agent'], ip: req.ip });
    this.setRefreshCookie(res, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken, expiresIn: result.expiresIn };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard)
  @Post('logout')
  async logout(@CurrentUser() user: AuthUser, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    await this.auth.logout(user.id, refreshToken);
    this.clearRefreshCookie(res);
    return { success: true };
  }

  @UseGuards(JwtAccessGuard)
  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard)
  @Post('resend-verification')
  async resendVerification(@CurrentUser() user: AuthUser) {
    return this.auth.requestEmailVerification(user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }
}
