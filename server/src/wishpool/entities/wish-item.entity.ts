import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum WishStatus {
  WAITING = 'waiting',
  FULFILLED = 'fulfilled',
  EXPIRED = 'expired',
}

@Entity('wish_items')
export class WishItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  user_id!: string;

  @Column()
  category_id!: string;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lat!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lng!: number;

  @Column('geography')
  @Index({ spatial: true })
  location!: string;

  @Column({ default: 3 })
  max_members!: number;

  @Column({ default: 0 })
  wish_count!: number;

  @Column({ default: 3 })
  threshold!: number;

  @Column({ type: 'uuid', nullable: true })
  converted_circle_id!: string;

  @Column({ type: 'timestamp', nullable: true })
  expires_at!: Date;

  @Column({ type: 'enum', enum: WishStatus, default: WishStatus.WAITING })
  status!: WishStatus;

  @CreateDateColumn()
  created_at!: Date;
}
