import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingsProvider } from './embeddings.provider';

@Injectable()
export class OpenAiEmbeddingsProvider implements EmbeddingsProvider {
  readonly model: string;
  readonly dimensions: number;
  private client: { embeddings: { create: (input: { model: string; input: string[] }) => Promise<{ data: Array<{ embedding: number[] }> }> } } | null = null;

  constructor(private readonly config: ConfigService) {
    this.model = config.get<string>('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small');
    this.dimensions = Number(config.get<string>('OPENAI_EMBEDDING_DIMENSIONS', '1536'));
  }

  private async getClient() {
    if (this.client) return this.client;
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
    const mod = await import('openai');
    type Client = NonNullable<typeof this.client>;
    type Ctor = new (opts: { apiKey: string }) => Client;
    const m = mod as unknown as { default?: Ctor; OpenAI?: Ctor };
    const OpenAI = m.default || m.OpenAI;
    if (!OpenAI) throw new Error('OpenAI client unavailable');
    this.client = new OpenAI({ apiKey });
    return this.client;
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const client = await this.getClient();
    const res = await client.embeddings.create({ model: this.model, input: texts });
    return res.data.map((d) => d.embedding as number[]);
  }
}
