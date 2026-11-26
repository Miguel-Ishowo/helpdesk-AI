import { Injectable, BadRequestException } from '@nestjs/common';
import { SourceType } from '../database/entities';

@Injectable()
export class DocumentExtractionService {
  async extract(input: { sourceType: SourceType; buffer?: Buffer; sourceUrl?: string | null }): Promise<string> {
    switch (input.sourceType) {
      case SourceType.TXT:
      case SourceType.MARKDOWN:
        if (!input.buffer) throw new BadRequestException('Missing file buffer');
        return input.buffer.toString('utf8').replace(/\0/g, '').trim();
      case SourceType.PDF:
        if (!input.buffer) throw new BadRequestException('Missing file buffer');
        return this.extractPdf(input.buffer);
      case SourceType.URL:
        if (!input.sourceUrl) throw new BadRequestException('Missing source URL');
        return this.extractUrl(input.sourceUrl);
      default:
        throw new BadRequestException('Unsupported source type');
    }
  }

  private async extractPdf(buffer: Buffer): Promise<string> {
    const mod: unknown = await import('pdf-parse');
    const PDFParse = (mod as { PDFParse?: new (opts: { data: Uint8Array }) => { getText: () => Promise<{ text?: string }>; destroy?: () => Promise<void> | void } }).PDFParse;
    if (!PDFParse) throw new BadRequestException('PDF parser unavailable');
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      return String(result?.text || '').replace(/\0/g, '').trim();
    } finally {
      if (typeof parser.destroy === 'function') await parser.destroy();
    }
  }

  private async extractUrl(url: string): Promise<string> {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'HelpDeskAI/1.0' } });
    if (!res.ok) throw new BadRequestException(`Failed to fetch URL (${res.status})`);
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
    return text;
  }
}
