import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';
import { UserRole } from './enums';

@Entity('invitations')
export class Invitation extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.ORG_MEMBER })
  role: UserRole;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  tokenHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  invitedById: string | null;

  @ManyToOne(() => Organization, (org) => org.invitations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;
}
