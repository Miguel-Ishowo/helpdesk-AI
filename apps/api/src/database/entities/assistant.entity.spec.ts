import { getMetadataArgsStorage } from 'typeorm';
import { Assistant } from './assistant.entity';

describe('Assistant entity', () => {
  it('has expected table and key columns', () => {
    const storage = getMetadataArgsStorage();
    const table = storage.tables.find((t) => t.target === Assistant);
    expect(table?.name).toBe('assistants');
    const cols = storage.columns.filter((c) => c.target === Assistant).map((c) => c.propertyName);
    expect(cols).toEqual(expect.arrayContaining([
      'organizationId', 'name', 'description', 'systemPrompt', 'model', 'temperature',
      'maxTokens', 'modelSettings', 'welcomeMessage', 'status', 'publicId', 'allowedDomains', 'widgetSettings', 'deletedAt',
    ]));
  });

  it('has org/status index and unique publicId', () => {
    const storage = getMetadataArgsStorage();
    const indices = storage.indices.filter((i) => i.target === Assistant);
    const hasOrgStatus = indices.some((i) => Array.isArray(i.columns) && i.columns.includes('organizationId') && i.columns.includes('status'));
    const hasPublicId = indices.some((i) => i.unique && (Array.isArray(i.columns) ? i.columns.includes('publicId') : false));
    expect(hasOrgStatus).toBe(true);
    expect(hasPublicId).toBe(true);
  });
});
