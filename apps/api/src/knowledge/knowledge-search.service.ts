import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentChunk } from '../database/entities';
import { OpenAiEmbeddingsProvider } from './openai-embeddings.provider';

export interface ChunkSearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  metadata: Record<string, unknown> | null;
  documentName?: string;
  sourceType?: string;
}

@Injectable()
export class KnowledgeSearchService {
  constructor(
    @InjectRepository(DocumentChunk) private readonly chunks: Repository<DocumentChunk>,
    private readonly embeddings: OpenAiEmbeddingsProvider,
  ) {}

  async search(assistantId: string, query: string, limit = 5): Promise<ChunkSearchResult[]> {
    const [vector] = await this.embeddings.embedTexts([query]);
    if (!vector) return [];
    const vec = `[${vector.join(',')}]`;
    // pgvector cosine distance operator <=>; score = 1 - distance
    const rows: Array<Record<string, unknown>> = await this.chunks.query(
      `SELECT c.id as "chunkId", c."documentId", c.content, c.metadata, d.name as "documentName", d."sourceType",
              1 - (c.embedding <=> $1::vector) as score
       FROM document_chunks c
       JOIN knowledge_documents d ON d.id = c."documentId"
       WHERE c."assistantId" = $2 AND c.embedding IS NOT NULL
       ORDER BY c.embedding <=> $1::vector
       LIMIT $3`,
      [vec, assistantId, limit],
    );
    return rows.map((r) => ({
      chunkId: String(r.chunkId),
      documentId: String(r.documentId),
      content: String(r.content),
      score: Number(r.score),
      metadata: (r.metadata as Record<string, unknown> | null) ?? null,
      documentName: r.documentName ? String(r.documentName) : undefined,
      sourceType: r.sourceType ? String(r.sourceType) : undefined,
    }));
  }
}
