import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('email_verification_tokens')
export class EmailVerificationToken extends BaseEntity {
  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  tokenHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt: Date | null;
}

@Entity('password_reset_tokens')
export class PasswordResetToken extends BaseEntity {
  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  tokenHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt: Date | null;
}
