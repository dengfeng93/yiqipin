import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 50 })
  name!: string;

  @Column({ length: 10 })
  icon!: string;

  @Column({ type: 'uuid', nullable: true })
  parent_id!: string | null;

  @Column({ default: 0 })
  sort!: number;

  @Column({ default: 100 })
  default_max_members!: number;

  @Column({ default: 3 })
  wish_threshold!: number;
}
