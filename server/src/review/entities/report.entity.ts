import { randomUUID } from 'crypto';
import { Entity, PrimaryColumn, Column, CreateDateColumn, Index, BeforeInsert } from 'typeorm';

@Entity('reports')
export class Report {
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
  reporter_id!: string;

  @Column({ nullable: true })
  @Index()
  target_user_id!: string;

  @Column({ nullable: true })
  circle_id!: string;

  @Column({ length: 30 })
  type!: string;

  @Column()
  reason!: string;

  @Column({ nullable: true })
  detail!: string;

  @Column({ default: 'pending' })
  @Index()
  status!: string;

  @Column({ nullable: true })
  handled_by!: string;

  @Column({ nullable: true })
  handled_at!: Date;

  @CreateDateColumn()
  created_at!: Date;
}
