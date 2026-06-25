import { randomUUID } from 'crypto';
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';

export enum CircleStatus {
  ACTIVE = 'active',
  PREPARING = 'preparing',
  DISSOLVED = 'dissolved',
  PRIVATE_PERMANENT = 'private_permanent',
  ARCHIVED = 'archived',
}

export enum StartType {
  NOW = 'now',
  TODAY = 'today',
  TOMORROW = 'tomorrow',
  CUSTOM = 'custom',
}

export enum RestrictTag {
  ALL = 'all',
  FEMALE_ONLY = 'female_only',
  NEWBIE_ONLY = 'newbie_only',
}

@Entity('circles')
export class Circle {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

  @Column()
  creator_id!: string;

  @Column()
  category_id!: string;

  @Column({ length: 100 })
  title!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ nullable: true })
  cover_image!: string;

  @Column('text')
  location!: string;

  @Column({ nullable: true })
  address!: string;

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 3 })
  range_km!: number;

  @Column({ default: 10 })
  max_members!: number;

  @Column({ type: 'timestamptz' })
  start_time!: Date;

  @Column({ default: 0 })
  prep_time!: number;

  @Column({ type: 'timestamptz', nullable: true })
  end_time!: Date;

  @Column({ type: 'enum', enum: StartType, default: StartType.NOW })
  start_type!: StartType;

  @Column({ type: 'enum', enum: CircleStatus, default: CircleStatus.PREPARING })
  status!: CircleStatus;

  @Column({ type: 'enum', enum: RestrictTag, default: RestrictTag.ALL })
  restrict_tag!: RestrictTag;

  @Column({ nullable: true })
  group_rule!: string;

  @Column({ nullable: true })
  dissolved_at!: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
