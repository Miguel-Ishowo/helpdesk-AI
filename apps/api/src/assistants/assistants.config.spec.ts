import { AssistantsService } from './assistants.service';

type RepoMock = { findOne: jest.Mock; find: jest.Mock; create: jest.Mock; save: jest.Mock; softRemove: jest.Mock };
function repoMock(): RepoMock {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((x: Record<string, unknown>) => ({ id: 'a1', ...x })),
    save: jest.fn(async (x: Record<string, unknown>) => ({ ...x })),
    softRemove: jest.fn(async (x: unknown) => x),
  };
}

describe('AssistantsService config', () => {
  it('updates config fields and keeps org scope', async () => {
    const repo = repoMock();
    repo.findOne.mockResolvedValue({ id: 'a1', organizationId: 'org-1', model: 'gpt-4o-mini', temperature: 0.7, maxTokens: null, modelSettings: null, systemPrompt: null, welcomeMessage: null, status: 'draft' });
    const service = new AssistantsService(repo as never);
    const res = await service.updateConfig('org-1', 'a1', { model: 'gpt-4o', temperature: 0.2, systemPrompt: 'Be helpful' } as never);
    expect(repo.save).toHaveBeenCalled();
    expect(res.model).toBe('gpt-4o');
    expect(res.temperature).toBe(0.2);
    expect(res.systemPrompt).toBe('Be helpful');
  });
});
