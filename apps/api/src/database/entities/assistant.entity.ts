import { Column, Entity, Index, ManyToOne, JoinColumn, OneToMany, DeleteDateColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';
import { AssistantStatus } from './enums';
import { KnowledgeDocument } from './knowledge-document.entity';
import { Conversation } from './conversation.entity';

@Entity('assistants')
@Index(['organizationId', 'status'])
export class Assistant extends BaseEntity {
  @Column({ type: 'uuid' })
  @Index()
  organizationId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  systemPrompt: string | null;

  @Column({ type: 'varchar', length: 100, default: 'gpt-4o-mini' })
  model: string;

  @Column({ type: 'float', default: 0.7 })
  temperature: number;

  @Column({ type: 'int', nullable: true })
  maxTokens: number | null;

  @Column({ type: 'jsonb', nullable: true })
  modelSettings: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  welcomeMessage: string | null;

  @Column({ type: 'enum', enum: AssistantStatus, default: AssistantStatus.DRAFT })
  status: AssistantStatus;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  publicId: string;

  @Column({ type: 'simple-array', nullable: true })
  allowedDomains: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  widgetSettings: Record<string, unknown> | null;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Organization, (org) => org.assistants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @OneToMany(() => KnowledgeDocument, (doc) => doc.assistant)
  documents: KnowledgeDocument[];

  @OneToMany(() => Conversation, (conv) => conv.assistant)
  conversations: Conversation[];
}
