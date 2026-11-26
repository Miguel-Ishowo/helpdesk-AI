import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership, MembershipStatus, UserRole } from '../../database/entities';
import { ORG_ROLES_KEY } from './org-roles.decorator';

@Injectable()
export class OrgRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Membership) private readonly memberships: Repository<Membership>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ORG_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const orgId = req.params.orgId || req.params.id;
    if (!user?.id || !orgId) throw new ForbiddenException('Organization context missing');

    const membership = await this.memberships.findOne({
      where: { userId: user.id, organizationId: orgId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) throw new ForbiddenException('Not a member of this organization');

    req.membership = membership;
    if (!requiredRoles || requiredRoles.length === 0) return true;
    if (!requiredRoles.includes(membership.role)) throw new ForbiddenException('Insufficient role');
    return true;
  }
}
