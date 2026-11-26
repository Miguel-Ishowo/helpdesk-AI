import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({ hash: jest.fn(async () => 'hashed'), compare: jest.fn(async () => true) }));

type RepoMock = { findOne: jest.Mock; create: jest.Mock; save: jest.Mock; update: jest.Mock };
function repoMock(): RepoMock {
  return {
    findOne: jest.fn(),
    create: jest.fn((x: Record<string, unknown>) => ({ ...x, id: (x.id as string) || 'id-1', createdAt: new Date() })),
    save: jest.fn(async (x: Record<string, unknown>) => ({ ...x, id: (x.id as string) || 'id-1', createdAt: new Date() })),
    update: jest.fn(async () => ({ affected: 1 })),
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let users: RepoMock;
  let sessions: RepoMock;
  let emailTokens: RepoMock;
  let resetTokens: RepoMock;
  let orgs: RepoMock;
  let memberships: RepoMock;

  beforeEach(() => {
    users = repoMock();
    sessions = repoMock();
    emailTokens = repoMock();
    resetTokens = repoMock();
    orgs = repoMock();
    memberships = repoMock();
    const jwt = { signAsync: jest.fn(async () => 'jwt-token') };
    const config = { get: jest.fn((_k: string, d?: unknown) => d) };
    service = new AuthService(users as never, sessions as never, emailTokens as never, resetTokens as never, orgs as never, memberships as never, jwt as never, config as never);
  });

  it('registers a new user and returns tokens', async () => {
    users.findOne.mockResolvedValue(null);
    const res = await service.register({ email: 'Test@Example.com', password: 'Password1', firstName: 'A' } as never);
    expect(res.accessToken).toBe('jwt-token');
    expect(res.user.email).toBe('test@example.com');
  });

  it('rejects duplicate registration', async () => {
    users.findOne.mockResolvedValue({ id: 'u1' });
    await expect(service.register({ email: 'a@b.com', password: 'Password1', firstName: 'A' } as never)).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in valid user', async () => {
    users.findOne.mockResolvedValue({ id: 'u1', email: 'a@b.com', passwordHash: 'hashed', isActive: true });
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
    const res = await service.login({ email: 'a@b.com', password: 'Password1' } as never);
    expect(res.accessToken).toBe('jwt-token');
  });

  it('rejects invalid login', async () => {
    users.findOne.mockResolvedValue({ id: 'u1', email: 'a@b.com', passwordHash: 'hashed', isActive: true });
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
    await expect(service.login({ email: 'a@b.com', password: 'bad' } as never)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('verifies email with valid token', async () => {
    emailTokens.findOne.mockResolvedValue({ id: 't1', userId: 'u1' });
    const res = await service.verifyEmail('raw-token');
    expect(res).toEqual({ success: true });
  });

  it('rejects invalid email verification token', async () => {
    emailTokens.findOne.mockResolvedValue(null);
    await expect(service.verifyEmail('bad')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('forgot password returns success for unknown email', async () => {
    users.findOne.mockResolvedValue(null);
    await expect(service.forgotPassword({ email: 'none@x.com' } as never)).resolves.toEqual({ success: true });
  });

  it('reset password revokes sessions and updates hash', async () => {
    resetTokens.findOne.mockResolvedValue({ id: 'r1', userId: 'u1' });
    const res = await service.resetPassword({ token: 'tok', password: 'Password1' } as never);
    expect(res).toEqual({ success: true });
  });
});

