import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { KnowledgeDocument } from './knowledge-document.entity';
import { Assistant } from './assistant.entity';

@Entity('document_chunks')
@Index(['assistantId', 'documentId'])
export class DocumentChunk extends BaseEntity {
  @Column({ type: 'uuid' })
  @Index()
  documentId: string;

  @Column({ type: 'uuid' })
  @Index()
  assistantId: string;

  @Column({ type: 'int' })
  chunkIndex: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', nullable: true })
  tokenCount: number | null;

  // pgvector column - created/managed via migration; kept as simple-array/text-compatible in entity
  // for TypeORM metadata portability. Actual column type is vector(1536) in Postgres migration.
  @Column({ type: 'simple-json', nullable: true, select: false })
  embedding: number[] | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @ManyToOne(() => KnowledgeDocument, (doc) => doc.chunks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document: KnowledgeDocument;

  @ManyToOne(() => Assistant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assistantId' })
  assistant: Assistant;
}
