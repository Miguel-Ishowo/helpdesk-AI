import { chunkText } from './chunk-text';

describe('chunkText', () => {
  it('splits long text into overlapping chunks', () => {
    const text = Array.from({ length: 40 }, (_, i) => `Sentence ${i}.`).join(' ');
    const chunks = chunkText(text, { maxChars: 120, overlap: 20 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].length).toBeLessThanOrEqual(120);
  });

  it('returns empty for blank text', () => {
    expect(chunkText('   \n\n  ')).toEqual([]);
  });
});
