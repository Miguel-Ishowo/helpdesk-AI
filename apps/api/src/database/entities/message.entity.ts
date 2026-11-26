import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Conversation } from './conversation.entity';
import { FeedbackValue, MessageRole } from './enums';

@Entity('messages')
@Index(['conversationId', 'createdAt'])
export class Message extends BaseEntity {
  @Column({ type: 'uuid' })
  @Index()
  conversationId: string;

  @Column({ type: 'enum', enum: MessageRole })
  role: MessageRole;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  sources: Record<string, unknown>[] | null;

  @Column({ type: 'enum', enum: FeedbackValue, nullable: true })
  feedback: FeedbackValue | null;

  @Column({ type: 'int', nullable: true })
  tokenCount: number | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @ManyToOne(() => Conversation, (conv) => conv.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;
}
