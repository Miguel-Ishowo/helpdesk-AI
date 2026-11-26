import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Assistant, KnowledgeDocument, DocumentStatus, SourceType } from '../database/entities';
import { LocalStorageProvider } from './storage/local.storage';
import { CreateUrlDocumentDto } from './dto';

type UploadFile = { buffer: Buffer; originalname: string; mimetype: string; size: number };

const ALLOWED: Record<string, SourceType> = {
  'application/pdf': SourceType.PDF,
  'text/plain': SourceType.TXT,
  'text/markdown': SourceType.MARKDOWN,
  'text/x-markdown': SourceType.MARKDOWN,
};
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(KnowledgeDocument) private readonly docs: Repository<KnowledgeDocument>,
    @InjectRepository(Assistant) private readonly assistants: Repository<Assistant>,
    private readonly storage: LocalStorageProvider,
  ) {}

  private async assertAssistant(orgId: string, assistantId: string) {
    const a = await this.assistants.findOne({ where: { id: assistantId, organizationId: orgId, deletedAt: IsNull() } });
    if (!a) throw new NotFoundException('Assistant not found');
    return a;
  }

  private detectType(file: UploadFile): SourceType {
    const name = file.originalname.toLowerCase();
    if (name.endsWith('.md') || name.endsWith('.markdown')) return SourceType.MARKDOWN;
    if (name.endsWith('.txt')) return SourceType.TXT;
    if (name.endsWith('.pdf')) return SourceType.PDF;
    const byMime = ALLOWED[file.mimetype];
    if (byMime) return byMime;
    throw new BadRequestException('Unsupported file type. Allowed: PDF, TXT, Markdown');
  }

  async upload(orgId: string, assistantId: string, file?: UploadFile) {
    if (!file) throw new BadRequestException('File is required');
    if (file.size > MAX_SIZE) throw new BadRequestException('File too large (max 10MB)');
    await this.assertAssistant(orgId, assistantId);
    const sourceType = this.detectType(file);
    const stored = await this.storage.save(
      { buffer: file.buffer, originalName: file.originalname, mimeType: file.mimetype },
      `org-${orgId}/assistant-${assistantId}`,
    );
    const doc = this.docs.create({
      assistantId,
      name: file.originalname.slice(0, 255),
      sourceType,
      sourceUrl: null,
      storagePath: stored.storagePath,
      status: DocumentStatus.PENDING,
      errorMessage: null,
      chunkCount: 0,
      metadata: { size: stored.size, mimeType: stored.mimeType, originalName: stored.originalName },
    });
    return this.docs.save(doc);
  }

  async createFromUrl(orgId: string, assistantId: string, dto: CreateUrlDocumentDto) {
    await this.assertAssistant(orgId, assistantId);
    let url: URL;
    try { url = new URL(dto.url); } catch { throw new BadRequestException('Invalid URL'); }
    if (!['http:', 'https:'].includes(url.protocol)) throw new BadRequestException('Only http/https URLs allowed');
    const doc = this.docs.create({
      assistantId,
      name: (dto.name || url.hostname).slice(0, 255),
      sourceType: SourceType.URL,
      sourceUrl: url.toString(),
      storagePath: null,
      status: DocumentStatus.PENDING,
      errorMessage: null,
      chunkCount: 0,
      metadata: { url: url.toString() },
    });
    return this.docs.save(doc);
  }

  async list(orgId: string, assistantId: string) {
    await this.assertAssistant(orgId, assistantId);
    return this.docs.find({ where: { assistantId }, order: { createdAt: 'DESC' } });
  }

  async get(orgId: string, assistantId: string, docId: string) {
    await this.assertAssistant(orgId, assistantId);
    const doc = await this.docs.findOne({ where: { id: docId, assistantId } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async remove(orgId: string, assistantId: string, docId: string) {
    const doc = await this.get(orgId, assistantId, docId);
    if (doc.storagePath) await this.storage.delete(doc.storagePath);
    await this.docs.remove(doc);
    return { success: true };
  }
}
