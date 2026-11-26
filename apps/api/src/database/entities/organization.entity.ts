import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Membership } from './membership.entity';
import { Assistant } from './assistant.entity';
import { Invitation } from './invitation.entity';

@Entity('organizations')
export class Organization extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Column({ type: 'uuid' })
  ownerId: string;

  @OneToMany(() => Membership, (membership) => membership.organization)
  memberships: Membership[];

  @OneToMany(() => Assistant, (assistant) => assistant.organization)
  assistants: Assistant[];

  @OneToMany(() => Invitation, (invitation) => invitation.organization)
  invitations: Invitation[];
}
