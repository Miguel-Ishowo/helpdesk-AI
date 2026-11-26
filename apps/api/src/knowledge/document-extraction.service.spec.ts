import { DocumentExtractionService } from './document-extraction.service';
import { SourceType } from '../database/entities';

describe('DocumentExtractionService', () => {
  const svc = new DocumentExtractionService();

  it('extracts TXT/Markdown as utf8 text', async () => {
    await expect(svc.extract({ sourceType: SourceType.TXT, buffer: Buffer.from('hello') })).resolves.toBe('hello');
    await expect(svc.extract({ sourceType: SourceType.MARKDOWN, buffer: Buffer.from('# hi') })).resolves.toBe('# hi');
  });

  it('extracts URL by stripping HTML', async () => {
    const realFetch = global.fetch;
    global.fetch = jest.fn(async () => ({ ok: true, text: async () => '<html><body><h1>Hello</h1><script>x</script></body></html>' })) as unknown as typeof fetch;
    try {
      await expect(svc.extract({ sourceType: SourceType.URL, sourceUrl: 'https://example.com' })).resolves.toContain('Hello');
    } finally {
      global.fetch = realFetch;
    }
  });

  it('fails for missing buffer/url', async () => {
    await expect(svc.extract({ sourceType: SourceType.TXT })).rejects.toThrow('Missing file buffer');
    await expect(svc.extract({ sourceType: SourceType.URL })).rejects.toThrow('Missing source URL');
  });
});
