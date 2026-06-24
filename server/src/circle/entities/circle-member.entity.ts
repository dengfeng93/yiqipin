import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('circle_members')
export class CircleMember {
  @Index()
  @PrimaryColumn()
  circle_id!: string;

  @Index()
  @PrimaryColumn()
  user_id!: string;

  @Column({ default: 'member' })
  role!: string;

  @CreateDateColumn()
  joined_at!: Date;

  @Column({ nullable: true })
  last_read_at!: Date;

  @Column({ default: false })
  is_anonymous!: boolean;

  @Column({ default: false })
  checked_in!: boolean;
}
