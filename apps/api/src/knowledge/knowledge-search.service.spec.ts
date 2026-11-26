import { KnowledgeSearchService } from './knowledge-search.service';

describe('KnowledgeSearchService', () => {
  it('embeds query and maps pgvector rows', async () => {
    const chunks = { query: jest.fn(async () => [{ chunkId: 'c1', documentId: 'd1', content: 'hello', score: 0.9, metadata: null, documentName: 'Doc', sourceType: 'txt' }]) };
    const embeddings = { embedTexts: jest.fn(async () => [[0.1, 0.2]]) };
    const svc = new KnowledgeSearchService(chunks as never, embeddings as never);
    const res = await svc.search('a1', 'hello', 3);
    expect(embeddings.embedTexts).toHaveBeenCalledWith(['hello']);
    expect(chunks.query).toHaveBeenCalled();
    expect(res[0].score).toBe(0.9);
  });
});
