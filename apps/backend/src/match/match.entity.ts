import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  driverId: string;

  @Column({ nullable: true })
  driverUsername: string;

  @Column({ nullable: true })
  passengerId: string;

  @Column({ nullable: true })
  passengerUsername: string;

  @Column({ default: false })
  driverConfirmed: boolean;

  @Column({ default: false })
  passengerConfirmed: boolean;

  @Column({
    type: 'enum',
    enum: ['pending', 'matched', 'completed'],
    default: 'pending',
  })
  status: 'pending' | 'matched' | 'completed';

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  driverLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  driverLongitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  passengerLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  passengerLongitude: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
