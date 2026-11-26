import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization, Membership, Invitation, User } from '../database/entities';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { OrgRoleGuard } from './guards/org-role.guard';

const hasDb = Boolean(process.env.DATABASE_URL || process.env.DB_HOST || process.env.DB_NAME);

@Module({
  imports: [...(hasDb ? [TypeOrmModule.forFeature([Organization, Membership, Invitation, User])] : [])],
  controllers: hasDb ? [OrganizationsController] : [],
  providers: hasDb ? [OrganizationsService, OrgRoleGuard] : [],
  exports: hasDb ? [OrganizationsService] : [],
})
export class OrganizationsModule {}
