import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto, InviteMemberDto, UpdateMemberRoleDto, AcceptInvitationDto } from './dto';
import { OrgRoleGuard } from './guards/org-role.guard';
import { OrgRoles } from './guards/org-roles.decorator';
import { UserRole } from '../database/entities';

@Controller('organizations')
@UseGuards(JwtAccessGuard)
export class OrganizationsController {
  constructor(private readonly orgs: OrganizationsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrganizationDto) {
    return this.orgs.create(user.id, dto);
  }

  @Get()
  findMine(@CurrentUser() user: AuthUser) {
    return this.orgs.findMyOrganizations(user.id);
  }

  @Post('invitations/accept')
  @HttpCode(HttpStatus.OK)
  acceptInvitation(@CurrentUser() user: AuthUser, @Body() dto: AcceptInvitationDto) {
    return this.orgs.acceptInvitation(user.id, dto.token);
  }

  @Get(':orgId')
  @UseGuards(OrgRoleGuard)
  findOne(@CurrentUser() user: AuthUser, @Param('orgId') orgId: string) {
    return this.orgs.findOneForUser(user.id, orgId);
  }

  @Patch(':orgId')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(UserRole.ORG_OWNER, UserRole.ORG_ADMIN)
  update(@Param('orgId') orgId: string, @Body() dto: UpdateOrganizationDto) {
    return this.orgs.update(orgId, dto);
  }

  @Get(':orgId/members')
  @UseGuards(OrgRoleGuard)
  listMembers(@Param('orgId') orgId: string) {
    return this.orgs.listMembers(orgId);
  }

  @Post(':orgId/invitations')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(UserRole.ORG_OWNER, UserRole.ORG_ADMIN)
  invite(@Param('orgId') orgId: string, @CurrentUser() user: AuthUser, @Body() dto: InviteMemberDto) {
    return this.orgs.invite(orgId, user.id, dto);
  }

  @Get(':orgId/invitations')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(UserRole.ORG_OWNER, UserRole.ORG_ADMIN)
  listInvitations(@Param('orgId') orgId: string) {
    return this.orgs.listInvitations(orgId);
  }

  @Patch(':orgId/members/:memberId')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(UserRole.ORG_OWNER, UserRole.ORG_ADMIN)
  updateMemberRole(
    @Param('orgId') orgId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.orgs.updateMemberRole(orgId, user.id, memberId, dto);
  }

  @Delete(':orgId/members/:memberId')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(UserRole.ORG_OWNER, UserRole.ORG_ADMIN)
  removeMember(@Param('orgId') orgId: string, @Param('memberId') memberId: string, @CurrentUser() user: AuthUser) {
    return this.orgs.removeMember(orgId, user.id, memberId);
  }
}
