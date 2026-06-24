import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum NotificationType {
  CIRCLE_WILL_END = 'circle_will_end',
  WISH_FULFILLED = 'wish_fulfilled',
  WISH_FAILED = 'wish_failed',
  SYSTEM = 'system',
}

@Entity('notifications')
@Index(['user_id', 'created_at'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  user_id!: string;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column()
  title!: string;

  @Column({ nullable: true })
  body!: string;

  @Column('jsonb', { default: '{}' })
  data!: object;

  @Column({ default: false })
  is_read!: boolean;

  @CreateDateColumn()
  created_at!: Date;
}
