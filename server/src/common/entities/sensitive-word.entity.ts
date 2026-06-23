import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('sensitive_words')
export class SensitiveWord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100, unique: true })
  word!: string;

  @Column({ type: 'smallint', default: 1 })
  level!: number;

  @Column({ length: 36, nullable: true })
  created_by!: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  created_at!: Date;
}
