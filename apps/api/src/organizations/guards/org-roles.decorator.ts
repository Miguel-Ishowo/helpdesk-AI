import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../database/entities';

export const ORG_ROLES_KEY = 'org_roles';
export const OrgRoles = (...roles: UserRole[]) => SetMetadata(ORG_ROLES_KEY, roles);
