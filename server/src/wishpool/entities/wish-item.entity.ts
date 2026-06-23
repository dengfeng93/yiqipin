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

  @Column('geography', { nullable: true })
  @Index({ spatial: true })
  location!: string;

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 5 })
  range_km!: number;

  @Column({ type: 'enum', enum: WishStatus, default: WishStatus.WAITING })
  status!: WishStatus;

  @CreateDateColumn()
  created_at!: Date;
}
