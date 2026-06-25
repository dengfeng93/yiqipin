import { randomUUID } from 'crypto';
import { Entity, PrimaryColumn, Column, CreateDateColumn, Index, BeforeInsert } from 'typeorm';

@Entity('user_reviews')
export class UserReview {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

  @Column()
  @Index()
  reviewer_id!: string;

  @Column()
  @Index()
  target_user_id!: string;

  @Column({ nullable: true })
  @Index()
  circle_id!: string;

  @Column({ default: false })
  showed_up!: boolean;

  @Column('text', { array: true, nullable: true })
  tags!: string[];

  @Column({ nullable: true })
  comment!: string;

  @CreateDateColumn()
  created_at!: Date;
}
