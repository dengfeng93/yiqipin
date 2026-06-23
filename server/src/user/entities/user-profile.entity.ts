import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryColumn()
  user_id!: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  showup_rate!: number;

  @Column({ default: 0 })
  showup_count!: number;

  @Column({ default: 0 })
  total_joined!: number;

  @Column({ default: 0 })
  recent_pigeon_count!: number;

  @Column({ default: 0 })
  total_created!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  circle_completion_rate!: number;

  @Column({ default: true })
  new_user_badge!: boolean;

  @UpdateDateColumn()
  updated_at!: Date;
}
