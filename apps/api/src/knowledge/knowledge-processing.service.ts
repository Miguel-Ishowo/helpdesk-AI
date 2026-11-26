import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Assistant, KnowledgeDocument, DocumentStatus } from '../database/entities';
import { LocalStorageProvider } from './storage/local.storage';
import { DocumentExtractionService } from './document-extraction.service';

@Injectable()
export class KnowledgeProcessingService {
  constructor(
    @InjectRepository(KnowledgeDocument) private readonly docs: Repository<KnowledgeDocument>,
    @InjectRepository(Assistant) private readonly assistants: Repository<Assistant>,
    private readonly storage: LocalStorageProvider,
    private readonly extraction: DocumentExtractionService,
  ) {}

  async processDocument(orgId: string, assistantId: string, docId: string) {
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
      doc.metadata = { ...(doc.metadata || {}), extractedLength: text.length, extractedAt: new Date().toISOString() };
      // R03 will chunk+embed; for R02 we mark as PENDING with extracted metadata? Better keep PROCESSING->PENDING? No.
      // Keep as INDEXED? no indexing done. Use PENDING is confusing. We'll set status back to PENDING but store extraction metadata and no error.
      doc.status = DocumentStatus.PENDING;
      await this.docs.save(doc);
      return { ...doc, extractedTextPreview: text.slice(0, 500) };
    } catch (e: unknown) {
      doc.status = DocumentStatus.FAILED;
      doc.errorMessage = e instanceof Error ? e.message.slice(0, 1000) : 'Extraction failed';
      await this.docs.save(doc);
      throw e;
    }
  }
}
