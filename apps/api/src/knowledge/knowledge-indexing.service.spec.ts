import { KnowledgeIndexingService } from './knowledge-indexing.service';
import { DocumentStatus, SourceType } from '../database/entities';

type RepoMock = { findOne: jest.Mock; create: jest.Mock; save: jest.Mock; delete: jest.Mock };
function repoMock(): RepoMock {
  return { findOne: jest.fn(), create: jest.fn((x: Record<string, unknown>) => ({ ...x })), save: jest.fn(async (x: unknown) => x), delete: jest.fn(async () => undefined) };
}

describe('KnowledgeIndexingService', () => {
  it('extracts, chunks, embeds and marks document indexed', async () => {
    const docs = repoMock();
    const chunks = repoMock();
    const assistants = repoMock();
    assistants.findOne.mockResolvedValue({ id: 'a1', organizationId: 'org-1' });
    docs.findOne.mockResolvedValue({ id: 'd1', assistantId: 'a1', sourceType: SourceType.TXT, storagePath: 'p', status: DocumentStatus.PENDING, metadata: {} });
    const storage = { read: jest.fn(async () => Buffer.from('Hello world. '.repeat(200))) };
    const extraction = { extract: jest.fn(async () => 'Hello world. '.repeat(200)) };
    const embeddings = { model: 'test-embed', dimensions: 3, embedTexts: jest.fn(async (texts: string[]) => texts.map(() => [0.1, 0.2, 0.3])) };

    const svc = new KnowledgeIndexingService(docs as never, chunks as never, assistants as never, storage as never, extraction as never, embeddings as never);
    const res = await svc.indexDocument('org-1', 'a1', 'd1');

    expect(chunks.delete).toHaveBeenCalledWith({ documentId: 'd1' });
    expect(embeddings.embedTexts).toHaveBeenCalled();
    expect(res.status).toBe(DocumentStatus.INDEXED);
    expect(res.chunkCount).toBeGreaterThan(0);
  });
});
