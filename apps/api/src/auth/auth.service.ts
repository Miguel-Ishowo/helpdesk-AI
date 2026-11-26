import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThan } from 'typeorm';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { User, Session, EmailVerificationToken, PasswordResetToken, Organization, Membership, UserRole, MembershipStatus } from '../database/entities';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto';

type TokenPair = { accessToken: string; refreshToken: string; expiresIn: string };

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
    @InjectRepository(EmailVerificationToken) private readonly emailTokens: Repository<EmailVerificationToken>,
    @InjectRepository(PasswordResetToken) private readonly resetTokens: Repository<PasswordResetToken>,
    @InjectRepository(Organization) private readonly orgs: Repository<Organization>,
    @InjectRepository(Membership) private readonly memberships: Repository<Membership>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async signTokens(user: User): Promise<TokenPair> {
    const accessSecret = this.config.get<string>('JWT_ACCESS_SECRET', 'change-me-access-secret');
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET', 'change-me-refresh-secret');
    const accessTtl = this.config.get<string>('JWT_ACCESS_TTL', '15m');
    const refreshTtl = this.config.get<string>('JWT_REFRESH_TTL', '7d');
    const payloadBase = { sub: user.id, email: user.email };
    const accessOpts: JwtSignOptions = { secret: accessSecret, expiresIn: accessTtl as JwtSignOptions['expiresIn'] };
    const refreshOpts: JwtSignOptions = { secret: refreshSecret, expiresIn: refreshTtl as JwtSignOptions['expiresIn'] };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync({ ...payloadBase, type: 'access' as const }, accessOpts),
      this.jwt.signAsync({ ...payloadBase, type: 'refresh' as const }, refreshOpts),
    ]);
    return { accessToken, refreshToken, expiresIn: accessTtl };
  }

  private refreshExpiryDate(): Date {
    const ttl = this.config.get<string>('JWT_REFRESH_TTL', '7d');
    const match = /^(\d+)([smhd])$/.exec(ttl);
    const msMap: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    if (!match) return new Date(Date.now() + 7 * 86400000);
    return new Date(Date.now() + Number(match[1]) * msMap[match[2]]);
  }

  private sanitizeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  async register(dto: RegisterDto, meta?: { userAgent?: string; ip?: string }) {
    const existing = await this.users.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException('Email already registered');

    const rounds = Number(this.config.get<string>('BCRYPT_ROUNDS', '12'));
    const passwordHash = await bcrypt.hash(dto.password, rounds);
    const user = this.users.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName ?? null,
      emailVerified: false,
      isActive: true,
    });
    await this.users.save(user);

    if (dto.organizationName) {
      const slugBase = dto.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
      const slug = `${slugBase || 'org'}-${randomBytes(3).toString('hex')}`;
      const org = this.orgs.create({ name: dto.organizationName, slug, ownerId: user.id });
      await this.orgs.save(org);
      const membership = this.memberships.create({
        userId: user.id,
        organizationId: org.id,
        role: UserRole.ORG_OWNER,
        status: MembershipStatus.ACTIVE,
      });
      await this.memberships.save(membership);
    }

    await this.createEmailVerificationToken(user.id);
    const tokens = await this.signTokens(user);
    await this.createSession(user.id, tokens.refreshToken, meta);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login(dto: LoginDto, meta?: { userAgent?: string; ip?: string }) {
    const user = await this.users.findOne({ where: { email: dto.email.toLowerCase() } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new ForbiddenException('Account disabled');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    user.lastLoginAt = new Date();
    await this.users.save(user);
    const tokens = await this.signTokens(user);
    await this.createSession(user.id, tokens.refreshToken, meta);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  private async createSession(userId: string, refreshToken: string, meta?: { userAgent?: string; ip?: string }) {
    const session = this.sessions.create({
      userId,
      refreshTokenHash: this.hashToken(refreshToken),
      expiresAt: this.refreshExpiryDate(),
      userAgent: meta?.userAgent?.slice(0, 255) ?? null,
      ipAddress: meta?.ip?.slice(0, 64) ?? null,
    });
    await this.sessions.save(session);
  }

  async refresh(userId: string, refreshToken: string, meta?: { userAgent?: string; ip?: string }) {
    const hash = this.hashToken(refreshToken);
    const session = await this.sessions.findOne({ where: { userId, refreshTokenHash: hash, revokedAt: IsNull() } });
    if (!session || session.expiresAt < new Date()) throw new UnauthorizedException('Invalid refresh token');
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid user');

    session.revokedAt = new Date();
    await this.sessions.save(session);

    const tokens = await this.signTokens(user);
    await this.createSession(user.id, tokens.refreshToken, meta);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const hash = this.hashToken(refreshToken);
      await this.sessions.update({ userId, refreshTokenHash: hash, revokedAt: IsNull() }, { revokedAt: new Date() });
      return { success: true };
    }
    await this.sessions.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
  }

  private async createEmailVerificationToken(userId: string) {
    const raw = randomBytes(32).toString('hex');
    const ttlHours = Number((this.config.get<string>('EMAIL_VERIFICATION_TOKEN_TTL', '24h').match(/^(\d+)/) || [null, '24'])[1]);
    const token = this.emailTokens.create({
      userId,
      tokenHash: this.hashToken(raw),
      expiresAt: new Date(Date.now() + ttlHours * 3600000),
    });
    await this.emailTokens.save(token);
    // TODO: send email via provider. Token logged only in dev for now? No - avoid leaking secrets.
    return raw;
  }

  async requestEmailVerification(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.emailVerified) return { success: true, alreadyVerified: true };
    await this.createEmailVerificationToken(userId);
    return { success: true };
  }

  async verifyEmail(token: string) {
    const hash = this.hashToken(token);
    const record = await this.emailTokens.findOne({ where: { tokenHash: hash, usedAt: IsNull(), expiresAt: MoreThan(new Date()) } });
    if (!record) throw new BadRequestException('Invalid or expired verification token');
    record.usedAt = new Date();
    await this.emailTokens.save(record);
    await this.users.update({ id: record.userId }, { emailVerified: true, emailVerifiedAt: new Date() });
    return { success: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.users.findOne({ where: { email: dto.email.toLowerCase() } });
    if (!user) return { success: true }; // don't leak existence
    const raw = randomBytes(32).toString('hex');
    const ttlHours = Number((this.config.get<string>('PASSWORD_RESET_TOKEN_TTL', '1h').match(/^(\d+)/) || [null, '1'])[1]);
    const token = this.resetTokens.create({
      userId: user.id,
      tokenHash: this.hashToken(raw),
      expiresAt: new Date(Date.now() + ttlHours * 3600000),
    });
    await this.resetTokens.save(token);
    // TODO: send email via provider.
    return { success: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const hash = this.hashToken(dto.token);
    const record = await this.resetTokens.findOne({ where: { tokenHash: hash, usedAt: IsNull(), expiresAt: MoreThan(new Date()) } });
    if (!record) throw new BadRequestException('Invalid or expired reset token');
    const rounds = Number(this.config.get<string>('BCRYPT_ROUNDS', '12'));
    const passwordHash = await bcrypt.hash(dto.password, rounds);
    await this.users.update({ id: record.userId }, { passwordHash });
    record.usedAt = new Date();
    await this.resetTokens.save(record);
    await this.sessions.update({ userId: record.userId, revokedAt: IsNull() }, { revokedAt: new Date() });
    return { success: true };
  }
}
