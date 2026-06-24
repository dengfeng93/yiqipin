import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  SYSTEM = 'system',
}

@Entity('circle_messages')
@Index(['circle_id', 'created_at'])
export class CircleMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  circle_id!: string;

  @Column()
  user_id!: string;

  @ManyToOne('User', 'messages', { lazy: false })
  @JoinColumn({ name: 'user_id' })
  user!: any;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type!: MessageType;

  @Column({ nullable: true })
  content!: string;

  @Column({ nullable: true })
  image_url!: string;

  @Column({ default: false })
  is_recalled!: boolean;

  @Column('jsonb', { nullable: true })
  recall_snapshot!: object;

  @CreateDateColumn()
  created_at!: Date;
}
