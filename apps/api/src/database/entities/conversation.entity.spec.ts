import { getMetadataArgsStorage } from 'typeorm';
import { Conversation } from './conversation.entity';

describe('Conversation entity', () => {
  it('has expected table and key columns', () => {
    const storage = getMetadataArgsStorage();
    const table = storage.tables.find((t) => t.target === Conversation);
    expect(table?.name).toBe('conversations');
    const cols = storage.columns.filter((c) => c.target === Conversation).map((c) => c.propertyName);
    expect(cols).toEqual(expect.arrayContaining([
      'organizationId', 'assistantId', 'visitorId', 'title', 'status', 'sourceDomain', 'lastMessageAt', 'metadata',
    ]));
  });

  it('has assistant/createdAt index', () => {
    const storage = getMetadataArgsStorage();
    const indices = storage.indices.filter((i) => i.target === Conversation);
    const has = indices.some((i) => Array.isArray(i.columns) && i.columns.includes('assistantId') && i.columns.includes('createdAt'));
    expect(has).toBe(true);
  });
});
