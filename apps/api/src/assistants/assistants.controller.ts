import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { OrgRoleGuard } from '../organizations/guards/org-role.guard';
import { OrgRoles } from '../organizations/guards/org-roles.decorator';
import { UserRole } from '../database/entities';
import { AssistantsService } from './assistants.service';
import { CreateAssistantDto, UpdateAssistantDto, UpdateAssistantConfigDto } from './dto';

@Controller('organizations/:orgId/assistants')
@UseGuards(JwtAccessGuard, OrgRoleGuard)
export class AssistantsController {
  constructor(private readonly assistants: AssistantsService) {}

  @Post()
  @OrgRoles(UserRole.ORG_OWNER, UserRole.ORG_ADMIN)
  create(@Param('orgId') orgId: string, @Body() dto: CreateAssistantDto) {
    return this.assistants.create(orgId, dto);
  }

  @Get()
  findAll(@Param('orgId') orgId: string) {
    return this.assistants.findAll(orgId);
  }

  @Get(':assistantId')
  findOne(@Param('orgId') orgId: string, @Param('assistantId') assistantId: string) {
    return this.assistants.findOne(orgId, assistantId);
  }

  @Get(':assistantId/config')
  @OrgRoles(UserRole.ORG_OWNER, UserRole.ORG_ADMIN)
  getConfig(@Param('orgId') orgId: string, @Param('assistantId') assistantId: string) {
    return this.assistants.getConfig(orgId, assistantId);
  }

  @Patch(':assistantId/config')
  @OrgRoles(UserRole.ORG_OWNER, UserRole.ORG_ADMIN)
  updateConfig(
    @Param('orgId') orgId: string,
    @Param('assistantId') assistantId: string,
    @Body() dto: UpdateAssistantConfigDto,
  ) {
    return this.assistants.updateConfig(orgId, assistantId, dto);
  }

  @Patch(':assistantId')
  @OrgRoles(UserRole.ORG_OWNER, UserRole.ORG_ADMIN)
  update(@Param('orgId') orgId: string, @Param('assistantId') assistantId: string, @Body() dto: UpdateAssistantDto) {
    return this.assistants.update(orgId, assistantId, dto);
  }

  @Delete(':assistantId')
  @OrgRoles(UserRole.ORG_OWNER, UserRole.ORG_ADMIN)
  remove(@Param('orgId') orgId: string, @Param('assistantId') assistantId: string) {
    return this.assistants.remove(orgId, assistantId);
  }
}
