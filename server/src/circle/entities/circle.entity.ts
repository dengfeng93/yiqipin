import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

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
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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

  @Column('geography', { nullable: true })
  @Index({ spatial: true })
  location!: string;

  @Column({ nullable: true })
  address!: string;

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 3 })
  range_km!: number;

  @Column({ default: 100 })
  max_members!: number;

  @Column({ type: 'timestamp' })
  start_time!: Date;

  @Column({ default: 0 })
  prep_time!: number;

  @Column({ type: 'enum', enum: StartType, default: StartType.NOW })
  start_type!: StartType;

  @Column({ type: 'enum', enum: CircleStatus, default: CircleStatus.ACTIVE })
  status!: CircleStatus;

  @Column({ type: 'enum', enum: RestrictTag, default: RestrictTag.ALL })
  restrict_tag!: RestrictTag;

  @Column({ nullable: true })
  group_rule!: string;

  @Column({ nullable: true })
  dissolved_at!: Date;

  @CreateDateColumn()
  created_at!: Date;
}
