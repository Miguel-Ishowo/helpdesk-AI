import { BadRequestException, NotFoundException } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { DocumentStatus, SourceType } from '../database/entities';

type RepoMock = { findOne: jest.Mock; find: jest.Mock; create: jest.Mock; save: jest.Mock; remove: jest.Mock };
function repoMock(): RepoMock {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((x: Record<string, unknown>) => ({ id: 'd1', createdAt: new Date(), ...x })),
    save: jest.fn(async (x: Record<string, unknown>) => ({ ...x })),
    remove: jest.fn(async (x: unknown) => x),
  };
}

describe('KnowledgeService', () => {
  let service: KnowledgeService;
  let docs: RepoMock;
  let assistants: RepoMock;
  let storage: { save: jest.Mock; delete: jest.Mock };

  beforeEach(() => {
    docs = repoMock();
    assistants = repoMock();
    storage = { save: jest.fn(async () => ({ storagePath: 'p/file.txt', size: 3, mimeType: 'text/plain', originalName: 'file.txt' })), delete: jest.fn(async () => undefined) };
    service = new KnowledgeService(docs as never, assistants as never, storage as never);
    assistants.findOne.mockResolvedValue({ id: 'a1', organizationId: 'org-1' });
  });

  it('uploads supported file and creates pending document', async () => {
    const res = await service.upload('org-1', 'a1', { buffer: Buffer.from('abc'), originalname: 'doc.txt', mimetype: 'text/plain', size: 3 } as never);
    expect(storage.save).toHaveBeenCalled();
    expect(docs.create).toHaveBeenCalledWith(expect.objectContaining({ assistantId: 'a1', sourceType: SourceType.TXT, status: DocumentStatus.PENDING }));
    expect((res as { storagePath: string }).storagePath).toBe('p/file.txt');
  });

  it('rejects unsupported file type', async () => {
    await expect(service.upload('org-1', 'a1', { buffer: Buffer.from('abc'), originalname: 'doc.exe', mimetype: 'application/octet-stream', size: 3 } as never)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects oversized file', async () => {
    await expect(service.upload('org-1', 'a1', { buffer: Buffer.from('abc'), originalname: 'doc.txt', mimetype: 'text/plain', size: 11 * 1024 * 1024 } as never)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates URL document', async () => {
    const res = await service.createFromUrl('org-1', 'a1', { url: 'https://example.com/docs', name: 'Docs' } as never);
    expect(docs.create).toHaveBeenCalledWith(expect.objectContaining({ sourceType: SourceType.URL, sourceUrl: 'https://example.com/docs', status: DocumentStatus.PENDING }));
    expect((res as { name: string }).name).toBe('Docs');
  });

  it('scopes document lookup to assistant/org', async () => {
    assistants.findOne.mockResolvedValueOnce(null);
    await expect(service.list('org-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes storage file when removing document', async () => {
    docs.findOne.mockResolvedValue({ id: 'd1', assistantId: 'a1', storagePath: 'p/file.txt' });
    await service.remove('org-1', 'a1', 'd1');
    expect(storage.delete).toHaveBeenCalledWith('p/file.txt');
    expect(docs.remove).toHaveBeenCalled();
  });
});
