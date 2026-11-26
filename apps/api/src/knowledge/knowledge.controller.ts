import { Controller, Get, Post, Delete, Param, UseGuards, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { OrgRoleGuard } from '../organizations/guards/org-role.guard';
import { OrgRoles } from '../organizations/guards/org-roles.decorator';
import { UserRole } from '../database/entities';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeProcessingService } from './knowledge-processing.service';
import { KnowledgeIndexingService } from './knowledge-indexing.service';
import { KnowledgeSearchService } from './knowledge-search.service';
import { CreateUrlDocumentDto } from './dto';

@Controller('organizations/:orgId/assistants/:assistantId/documents')
@UseGuards(JwtAccessGuard, OrgRoleGuard)
export class KnowledgeController {
  constructor(
    private readonly knowledge: KnowledgeService,
    private readonly processing: KnowledgeProcessingService,
    private readonly indexing: KnowledgeIndexingService,
    private readonly search: KnowledgeSearchService,
  ) {}

  @Post('upload')
  @OrgRoles(UserRole.ORG_OWNER, UserRole.ORG_ADMIN)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  upload(@Param('orgId') orgId: string, @Param('assistantId') assistantId: string, @UploadedFile() file?: { buffer: Buffer; originalname: string; mimetype: string; size: number }) {
    return this.knowledge.upload(orgId, assistantId, file);
  }

  @Post('url')
  @OrgRoles(UserRole.ORG_OWNER, UserRole.ORG_ADMIN)
  createFromUrl(@Param('orgId') orgId: string, @Param('assistantId') assistantId: string, @Body() dto: CreateUrlDocumentDto) {
    return this.knowledge.createFromUrl(orgId, assistantId, dto);
  }

  @Get()
  list(@Param('orgId') orgId: string, @Param('assistantId') assistantId: string) {
    return this.knowledge.list(orgId, assistantId);
  }

  @Get(':documentId')
  get(@Param('orgId') orgId: string, @Param('assistantId') assistantId: string, @Param('documentId') documentId: string) {
    return this.knowledge.get(orgId, assistantId, documentId);
  }

  @Post('search')
  searchDocs(@Param('orgId') _orgId: string, @Param('assistantId') assistantId: string, @Body() body: { query: string; limit?: number }) {
    return this.search.search(assistantId, body.query, body.limit ?? 5);
  }

  @Post(':documentId/process')
  @OrgRoles(UserRole.ORG_OWNER, UserRole.ORG_ADMIN)
  process(@Param('orgId') orgId: string, @Param('assistantId') assistantId: string, @Param('documentId') documentId: string) {
    return this.processing.processDocument(orgId, assistantId, documentId);
  }

  @Post(':documentId/index')
  @OrgRoles(UserRole.ORG_OWNER, UserRole.ORG_ADMIN)
  index(@Param('orgId') orgId: string, @Param('assistantId') assistantId: string, @Param('documentId') documentId: string) {
    return this.indexing.indexDocument(orgId, assistantId, documentId);
  }

  @Delete(':documentId')
  @OrgRoles(UserRole.ORG_OWNER, UserRole.ORG_ADMIN)
  remove(@Param('orgId') orgId: string, @Param('assistantId') assistantId: string, @Param('documentId') documentId: string) {
    return this.knowledge.remove(orgId, assistantId, documentId);
  }
}
