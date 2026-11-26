import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Assistant, DocumentChunk, DocumentStatus, KnowledgeDocument } from '../database/entities';
import { chunkText } from './chunk-text';
import { DocumentExtractionService } from './document-extraction.service';
import { OpenAiEmbeddingsProvider } from './openai-embeddings.provider';
import { LocalStorageProvider } from './storage/local.storage';

@Injectable()
export class KnowledgeIndexingService {
  private readonly logger = new Logger(KnowledgeIndexingService.name);

  constructor(
    @InjectRepository(KnowledgeDocument) private readonly docs: Repository<KnowledgeDocument>,
    @InjectRepository(DocumentChunk) private readonly chunks: Repository<DocumentChunk>,
    @InjectRepository(Assistant) private readonly assistants: Repository<Assistant>,
    private readonly storage: LocalStorageProvider,
    private readonly extraction: DocumentExtractionService,
    private readonly embeddings: OpenAiEmbeddingsProvider,
  ) {}

  async indexDocument(orgId: string, assistantId: string, docId: string) {
    const assistant = await this.assistants.findOne({ where: { id: assistantId, organizationId: orgId, deletedAt: IsNull() } });
    if (!assistant) throw new NotFoundException('Assistant not found');
    const doc = await this.docs.findOne({ where: { id: docId, assistantId } });
    if (!doc) throw new NotFoundException('Document not found');

    doc.status = DocumentStatus.PROCESSING;
    doc.errorMessage = null;
    await this.docs.save(doc);

    try {
      const buffer = doc.storagePath ? await this.storage.read(doc.storagePath) : undefined;
      const text = await this.extraction.extract({ sourceType: doc.sourceType, buffer, sourceUrl: doc.sourceUrl });
      const parts = chunkText(text);
      await this.chunks.delete({ documentId: doc.id });

      if (parts.length > 0) {
        const vectors = await this.embeddings.embedTexts(parts);
        const entities = parts.map((content, i) => this.chunks.create({
          documentId: doc.id,
          assistantId: doc.assistantId,
          chunkIndex: i,
          content,
          tokenCount: Math.ceil(content.length / 4),
          embedding: vectors[i] ?? null,
          metadata: { sourceType: doc.sourceType, name: doc.name },
        }));
        await this.chunks.save(entities);
      }

      doc.chunkCount = parts.length;
      doc.status = DocumentStatus.INDEXED;
      doc.metadata = { ...(doc.metadata || {}), extractedLength: text.length, indexedAt: new Date().toISOString(), embeddingModel: this.embeddings.model };
      await this.docs.save(doc);
      return doc;
    } catch (e: unknown) {
      this.logger.warn(`Indexing failed for document ${doc.id}: ${e instanceof Error ? e.message : String(e)}`);
      doc.status = DocumentStatus.FAILED;
      doc.errorMessage = e instanceof Error ? e.message.slice(0, 1000) : 'Indexing failed';
      await this.docs.save(doc);
      throw e;
    }
  }
}
