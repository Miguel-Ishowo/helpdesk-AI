import { ForbiddenException, ConflictException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { UserRole, MembershipStatus } from '../database/entities';

type RepoMock = { findOne: jest.Mock; find: jest.Mock; create: jest.Mock; save: jest.Mock; remove: jest.Mock };
function repoMock(): RepoMock {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((x: Record<string, unknown>) => ({ ...x, id: (x.id as string) || 'id-1', createdAt: new Date() })),
    save: jest.fn(async (x: Record<string, unknown>) => ({ ...x, id: (x.id as string) || 'id-1', createdAt: new Date() })),
    remove: jest.fn(async (x: unknown) => x),
  };
}

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let orgs: RepoMock;
  let memberships: RepoMock;
  let invitations: RepoMock;
  let users: RepoMock;

  beforeEach(() => {
    orgs = repoMock();
    memberships = repoMock();
    invitations = repoMock();
    users = repoMock();
    service = new OrganizationsService(orgs as never, memberships as never, invitations as never, users as never);
  });

  it('creates org and owner membership', async () => {
    orgs.findOne.mockResolvedValue(null);
    const res = await service.create('u1', { name: 'Acme Inc' });
    expect(res.name).toBe('Acme Inc');
    expect(memberships.save).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1', role: UserRole.ORG_OWNER }));
  });

  it('lists my organizations from active memberships', async () => {
    memberships.find.mockResolvedValue([{ role: UserRole.ORG_MEMBER, status: MembershipStatus.ACTIVE, organization: { id: 'o1', name: 'Org' } }]);
    const res = await service.findMyOrganizations('u1');
    expect(res[0].myRole).toBe(UserRole.ORG_MEMBER);
  });

  it('rejects invite when pending invitation exists', async () => {
    users.findOne.mockResolvedValue(null);
    invitations.findOne.mockResolvedValue({ id: 'i1', expiresAt: new Date(Date.now() + 10000), acceptedAt: null });
    await expect(service.invite('o1', 'u1', { email: 'a@b.com', role: UserRole.ORG_MEMBER } as never)).rejects.toBeInstanceOf(ConflictException);
  });

  it('prevents removing organization owner', async () => {
    orgs.findOne.mockResolvedValue({ id: 'o1', ownerId: 'owner-1' });
    memberships.findOne.mockResolvedValue({ id: 'm1', userId: 'owner-1', organizationId: 'o1' });
    await expect(service.removeMember('o1', 'admin-1', 'm1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('accepts invitation for matching user email', async () => {
    invitations.findOne.mockResolvedValue({ id: 'i1', email: 'a@b.com', organizationId: 'o1', role: UserRole.ORG_MEMBER, expiresAt: new Date(Date.now() + 10000), acceptedAt: null });
    users.findOne.mockResolvedValue({ id: 'u1', email: 'a@b.com' });
    memberships.findOne.mockResolvedValue(null);
    const res = await service.acceptInvitation('u1', 'raw-token');
    expect(res).toEqual({ success: true, organizationId: 'o1', role: UserRole.ORG_MEMBER });
    expect(memberships.save).toHaveBeenCalled();
  });
});
