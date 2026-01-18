import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('detections')
export class Detection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('json')
  detections: any;

  @Column('text')
  instruction: string;

  @Column({ type: 'int', nullable: true })
  imageWidth: number;

  @Column({ type: 'int', nullable: true })
  imageHeight: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  driverLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  driverLongitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  passengerLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  passengerLongitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  distanceMeters: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  direction: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
