import {
  Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { randomBytes, createHash } from 'crypto';
import { Organization, Membership, Invitation, User, UserRole, MembershipStatus } from '../database/entities';
import { CreateOrganizationDto, UpdateOrganizationDto, InviteMemberDto, UpdateMemberRoleDto } from './dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization) private readonly orgs: Repository<Organization>,
    @InjectRepository(Membership) private readonly memberships: Repository<Membership>,
    @InjectRepository(Invitation) private readonly invitations: Repository<Invitation>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  private slugify(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'org';
  }

  private async uniqueSlug(base: string): Promise<string> {
    let slug = this.slugify(base);
    const exists = await this.orgs.findOne({ where: { slug } });
    if (!exists) return slug;
    slug = `${slug}-${randomBytes(3).toString('hex')}`;
    return slug;
  }

  async create(userId: string, dto: CreateOrganizationDto) {
    const slug = await this.uniqueSlug(dto.slug || dto.name);
    const org = this.orgs.create({ name: dto.name, slug, ownerId: userId });
    await this.orgs.save(org);
    await this.memberships.save(this.memberships.create({
      userId, organizationId: org.id, role: UserRole.ORG_OWNER, status: MembershipStatus.ACTIVE,
    }));
    return org;
  }

  async findMyOrganizations(userId: string) {
    const memberships = await this.memberships.find({
      where: { userId, status: MembershipStatus.ACTIVE },
      relations: ['organization'],
      order: { createdAt: 'DESC' },
    });
    return memberships.map((m) => ({ ...m.organization, myRole: m.role, membershipStatus: m.status }));
  }

  async findOneForUser(userId: string, orgId: string) {
    const membership = await this.memberships.findOne({ where: { userId, organizationId: orgId, status: MembershipStatus.ACTIVE } });
    if (!membership) throw new ForbiddenException('Not a member of this organization');
    const org = await this.orgs.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');
    return { ...org, myRole: membership.role };
  }

  async update(orgId: string, dto: UpdateOrganizationDto) {
    const org = await this.orgs.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');
    if (dto.name !== undefined) org.name = dto.name;
    if (dto.slug !== undefined) {
      const slug = this.slugify(dto.slug);
      const existing = await this.orgs.findOne({ where: { slug } });
      if (existing && existing.id !== orgId) throw new ConflictException('Slug already used');
      org.slug = slug;
    }
    await this.orgs.save(org);
    return org;
  }

  async listMembers(orgId: string) {
    const members = await this.memberships.find({
      where: { organizationId: orgId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      status: m.status,
      createdAt: m.createdAt,
      user: m.user ? { id: m.user.id, email: m.user.email, firstName: m.user.firstName, lastName: m.user.lastName } : null,
    }));
  }

  async invite(orgId: string, invitedById: string, dto: InviteMemberDto) {
    if (![UserRole.ORG_ADMIN, UserRole.ORG_MEMBER].includes(dto.role)) {
      throw new BadRequestException('Invalid role for invitation');
    }
    const email = dto.email.toLowerCase();
    const existingUser = await this.users.findOne({ where: { email } });
    if (existingUser) {
      const existingMembership = await this.memberships.findOne({ where: { userId: existingUser.id, organizationId: orgId } });
      if (existingMembership) throw new ConflictException('User is already a member');
    }
    const pending = await this.invitations.findOne({ where: { email, organizationId: orgId, acceptedAt: IsNull() } });
    if (pending && pending.expiresAt > new Date()) throw new ConflictException('Pending invitation already exists');

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const inv = this.invitations.create({
      email, organizationId: orgId, role: dto.role, tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600000), invitedById,
    });
    await this.invitations.save(inv);
    // TODO: send invitation email. Do not expose raw token in logs.
    return { id: inv.id, email: inv.email, role: inv.role, expiresAt: inv.expiresAt };
  }

  async listInvitations(orgId: string) {
    const invs = await this.invitations.find({ where: { organizationId: orgId }, order: { createdAt: 'DESC' } });
    return invs.map((i) => ({ id: i.id, email: i.email, role: i.role, expiresAt: i.expiresAt, acceptedAt: i.acceptedAt, createdAt: i.createdAt }));
  }

  async acceptInvitation(userId: string, token: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const inv = await this.invitations.findOne({ where: { tokenHash, acceptedAt: IsNull() } });
    if (!inv || inv.expiresAt < new Date()) throw new BadRequestException('Invalid or expired invitation');
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.email.toLowerCase() !== inv.email.toLowerCase()) throw new ForbiddenException('Invitation email mismatch');

    let membership = await this.memberships.findOne({ where: { userId, organizationId: inv.organizationId } });
    if (!membership) {
      membership = this.memberships.create({ userId, organizationId: inv.organizationId, role: inv.role, status: MembershipStatus.ACTIVE });
      await this.memberships.save(membership);
    } else {
      membership.status = MembershipStatus.ACTIVE;
      membership.role = inv.role;
      await this.memberships.save(membership);
    }
    inv.acceptedAt = new Date();
    await this.invitations.save(inv);
    return { success: true, organizationId: inv.organizationId, role: membership.role };
  }

  async updateMemberRole(orgId: string, actorUserId: string, memberId: string, dto: UpdateMemberRoleDto) {
    const org = await this.orgs.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');
    const target = await this.memberships.findOne({ where: { id: memberId, organizationId: orgId } });
    if (!target) throw new NotFoundException('Member not found');
    if (target.userId === org.ownerId) throw new ForbiddenException('Cannot change owner role');
    if (target.userId === actorUserId) throw new ForbiddenException('Cannot change your own role');
    if (![UserRole.ORG_ADMIN, UserRole.ORG_MEMBER].includes(dto.role)) throw new BadRequestException('Invalid role');
    target.role = dto.role;
    await this.memberships.save(target);
    return { id: target.id, userId: target.userId, role: target.role, status: target.status };
  }

  async removeMember(orgId: string, actorUserId: string, memberId: string) {
    const org = await this.orgs.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');
    const target = await this.memberships.findOne({ where: { id: memberId, organizationId: orgId } });
    if (!target) throw new NotFoundException('Member not found');
    if (target.userId === org.ownerId) throw new ForbiddenException('Cannot remove organization owner');
    if (target.userId === actorUserId) throw new ForbiddenException('Cannot remove yourself');
    await this.memberships.remove(target);
    return { success: true };
  }
}
