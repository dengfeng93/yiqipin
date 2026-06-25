import { randomUUID } from 'crypto';
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Index,
  BeforeInsert,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

  @Column({ unique: true })
  @Index()
  wechat_openid!: string;

  @Column({ unique: true, nullable: true })
  phone!: string;

  @Column({ length: 50 })
  nickname!: string;

  @Column({ nullable: true })
  avatar!: string;

  @Column('text', { array: true, default: [] })
  interests!: string[];

  @Column({ default: 'user' })
  role!: string;

  @Column({ type: 'timestamptz', nullable: true })
  muted_until!: Date;

  @Column({ default: false })
  is_incognito!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @DeleteDateColumn()
  deleted_at!: Date;
}
