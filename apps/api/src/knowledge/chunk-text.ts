export function chunkText(text: string, opts?: { maxChars?: number; overlap?: number }): string[] {
  const maxChars = opts?.maxChars ?? 1200;
  const overlap = opts?.overlap ?? 150;
  const clean = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!clean) return [];
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(clean.length, i + maxChars);
    let slice = clean.slice(i, end);
    if (end < clean.length) {
      const lastBreak = Math.max(slice.lastIndexOf('\n\n'), slice.lastIndexOf('. '), slice.lastIndexOf('\n'));
      if (lastBreak > Math.floor(maxChars * 0.6)) slice = slice.slice(0, lastBreak + 1);
    }
    const trimmed = slice.trim();
    if (trimmed) chunks.push(trimmed);
    const advance = Math.max(1, slice.length - overlap);
    i += advance;
    if (i >= clean.length) break;
  }
  return chunks;
}
