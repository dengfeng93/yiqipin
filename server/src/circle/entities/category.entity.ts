import { randomUUID } from 'crypto';
import { Entity, PrimaryColumn, Column, CreateDateColumn, BeforeInsert } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

  @Column({ length: 30 })
  name!: string;

  @Column({ length: 10 })
  icon!: string;

  @Column({ type: 'uuid', nullable: true })
  parent_id!: string | null;

  @Column({ default: 0 })
  sort!: number;

  @Column({ default: 10 })
  default_max_members!: number;

  @Column({ default: 3 })
  wish_threshold!: number;

  @CreateDateColumn()
  created_at!: Date;
}
