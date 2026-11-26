import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeDocument, Assistant, Membership, DocumentChunk } from '../database/entities';
import { OrgRoleGuard } from '../organizations/guards/org-role.guard';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeProcessingService } from './knowledge-processing.service';
import { KnowledgeIndexingService } from './knowledge-indexing.service';
import { KnowledgeSearchService } from './knowledge-search.service';
import { DocumentExtractionService } from './document-extraction.service';
import { OpenAiEmbeddingsProvider } from './openai-embeddings.provider';
import { LocalStorageProvider } from './storage/local.storage';

const hasDb = Boolean(process.env.DATABASE_URL || process.env.DB_HOST || process.env.DB_NAME);

@Module({
  imports: [...(hasDb ? [TypeOrmModule.forFeature([KnowledgeDocument, Assistant, Membership, DocumentChunk])] : [])],
  controllers: hasDb ? [KnowledgeController] : [],
  providers: hasDb ? [KnowledgeService, KnowledgeProcessingService, KnowledgeIndexingService, KnowledgeSearchService, DocumentExtractionService, OpenAiEmbeddingsProvider, LocalStorageProvider, OrgRoleGuard] : [],
  exports: hasDb ? [KnowledgeService, KnowledgeProcessingService, KnowledgeIndexingService, KnowledgeSearchService] : [],
})
export class KnowledgeModule {}
