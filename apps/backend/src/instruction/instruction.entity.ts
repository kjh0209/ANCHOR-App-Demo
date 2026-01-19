import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('instructions')
export class Instruction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  matchId: string;

  @Column('text')
  content: string;

  @Column({ default: false })
  sentToPassenger: boolean;

  @Column('json', { nullable: true })
  detectionData: any;

  @Column({ type: 'int', nullable: true })
  imageWidth: number;

  @Column({ type: 'int', nullable: true })
  imageHeight: number;

  @CreateDateColumn()
  createdAt: Date;
}
