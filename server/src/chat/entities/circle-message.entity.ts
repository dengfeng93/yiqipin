import { randomUUID } from 'crypto';
import { Entity, PrimaryColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn, BeforeInsert } from 'typeorm';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  SYSTEM = 'system',
}

@Entity('circle_messages')
@Index(['circle_id', 'created_at'])
export class CircleMessage {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

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
