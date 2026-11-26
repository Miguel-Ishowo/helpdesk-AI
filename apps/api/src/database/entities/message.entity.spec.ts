import { getMetadataArgsStorage } from 'typeorm';
import { Message } from './message.entity';

describe('Message entity', () => {
  it('has expected table and key columns', () => {
    const storage = getMetadataArgsStorage();
    const table = storage.tables.find((t) => t.target === Message);
    expect(table?.name).toBe('messages');
    const cols = storage.columns.filter((c) => c.target === Message).map((c) => c.propertyName);
    expect(cols).toEqual(expect.arrayContaining([
      'conversationId', 'role', 'content', 'sources', 'feedback', 'tokenCount', 'metadata',
    ]));
  });

  it('has conversationId/createdAt index', () => {
    const storage = getMetadataArgsStorage();
    const indices = storage.indices.filter((i) => i.target === Message);
    const has = indices.some((i) => Array.isArray(i.columns) && i.columns.includes('conversationId') && i.columns.includes('createdAt'));
    expect(has).toBe(true);
  });
});
