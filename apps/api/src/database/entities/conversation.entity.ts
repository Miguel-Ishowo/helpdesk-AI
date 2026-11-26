import { Column, Entity, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Assistant } from './assistant.entity';
import { Organization } from './organization.entity';
import { ConversationStatus } from './enums';
import { Message } from './message.entity';

@Entity('conversations')
@Index(['assistantId', 'createdAt'])
export class Conversation extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  @Index()
  organizationId: string | null;

  @Column({ type: 'uuid' })
  @Index()
  assistantId: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  @Index()
  visitorId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'enum', enum: ConversationStatus, default: ConversationStatus.OPEN })
  @Index()
  status: ConversationStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sourceDomain: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastMessageAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization | null;

  @ManyToOne(() => Assistant, (assistant) => assistant.conversations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assistantId' })
  assistant: Assistant;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];
}
