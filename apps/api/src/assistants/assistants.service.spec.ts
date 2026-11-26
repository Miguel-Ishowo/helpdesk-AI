import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AssistantsService } from './assistants.service';
import { AssistantStatus } from '../database/entities';

type RepoMock = { findOne: jest.Mock; find: jest.Mock; create: jest.Mock; save: jest.Mock; softRemove: jest.Mock };
function repoMock(): RepoMock {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((x: Record<string, unknown>) => ({ id: 'a1', createdAt: new Date(), updatedAt: new Date(), deletedAt: null, ...x })),
    save: jest.fn(async (x: Record<string, unknown>) => ({ ...x })),
    softRemove: jest.fn(async (x: unknown) => x),
  };
}

describe('AssistantsService', () => {
  let service: AssistantsService;
  let repo: RepoMock;

  beforeEach(() => {
    repo = repoMock();
    service = new AssistantsService(repo as never);
    repo.findOne.mockResolvedValue(null); // for publicId uniqueness check
  });

  it('creates assistant with defaults and generated publicId', async () => {
    const res = await service.create('org-1', { name: 'Support Bot' } as never);
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: 'org-1', name: 'Support Bot', model: 'gpt-4o-mini', status: AssistantStatus.DRAFT,
    }));
    expect((res as { publicId: string }).publicId).toMatch(/^asst_/);
  });

  it('rejects unsupported model', async () => {
    await expect(service.create('org-1', { name: 'Bot', model: 'bad-model' } as never)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('normalizes allowed domains and rejects invalid', async () => {
    await service.create('org-1', { name: 'Bot', allowedDomains: ['https://Example.com/path', 'app.example.com'] } as never);
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ allowedDomains: ['example.com', 'app.example.com'] }));
    await expect(service.create('org-1', { name: 'Bot', allowedDomains: ['not a domain'] } as never)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('scopes findOne by org and excludes deleted', async () => {
    repo.findOne.mockResolvedValueOnce({ id: 'a1', organizationId: 'org-1', name: 'Bot' });
    const res = await service.findOne('org-1', 'a1');
    expect(res.id).toBe('a1');
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'a1', organizationId: 'org-1', deletedAt: expect.anything() } });
  });

  it('throws NotFound when assistant missing in org', async () => {
    repo.findOne.mockResolvedValueOnce(null);
    await expect(service.findOne('org-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('soft removes assistant', async () => {
    const assistant = { id: 'a1', organizationId: 'org-1' };
    repo.findOne.mockResolvedValueOnce(assistant);
    const res = await service.remove('org-1', 'a1');
    expect(repo.softRemove).toHaveBeenCalledWith(assistant);
    expect(res).toEqual({ success: true });
  });
});
