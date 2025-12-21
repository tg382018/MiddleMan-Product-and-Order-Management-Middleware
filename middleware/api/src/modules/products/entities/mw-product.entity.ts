import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('mw_products')
export class MwProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  erpId: string;

  @Index()
  @Column()
  sku: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column('int')
  stock: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  imageKey?: string;

  @Column({ type: 'timestamptz' })
  erpUpdatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  erpDeletedAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


