import { Column, Entity, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Assistant } from './assistant.entity';
import { DocumentStatus, SourceType } from './enums';
import { DocumentChunk } from './document-chunk.entity';

@Entity('knowledge_documents')
export class KnowledgeDocument extends BaseEntity {
  @Column({ type: 'uuid' })
  @Index()
  assistantId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: SourceType })
  sourceType: SourceType;

  @Column({ type: 'text', nullable: true })
  sourceUrl: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  storagePath: string | null;

  @Column({ type: 'enum', enum: DocumentStatus, default: DocumentStatus.PENDING })
  @Index()
  status: DocumentStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'int', default: 0 })
  chunkCount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @ManyToOne(() => Assistant, (assistant) => assistant.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assistantId' })
  assistant: Assistant;

  @OneToMany(() => DocumentChunk, (chunk) => chunk.document)
  chunks: DocumentChunk[];
}
