import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MwOrderItem } from './mw-order-item.entity';
import { MwUser } from '../../users/entities/mw-user.entity';
import { ManyToOne, JoinColumn } from 'typeorm';

export enum MwOrderStage {
  ERP = 'ERP',
  LOGISTICS = 'LOGISTICS',
}

export enum MwLogisticsStatus {
  PAKET_HAZIRLANIYOR = 'PAKET_HAZIRLANIYOR',
  MERKEZ_SUBEDE = 'MERKEZ_SUBEDE',
  SEHIRE_ULASTI = 'SEHIRE_ULASTI',
  DAGITIMDA = 'DAGITIMDA',
  TESLIM_EDILDI = 'TESLIM_EDILDI',
  IPTAL_OLDU = 'IPTAL_OLDU',
}

@Entity('mw_orders')
export class MwOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  erpId: string;

  @Column()
  status: string;

  @Column('decimal', { precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ type: 'enum', enum: MwOrderStage, default: MwOrderStage.ERP })
  stage: MwOrderStage;

  @Column({ type: 'enum', enum: MwLogisticsStatus, nullable: true })
  logisticsStatus?: MwLogisticsStatus | null;

  @Column({ type: 'timestamptz', nullable: true })
  sentToLogisticsAt?: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  shippingAddress?: any | null;

  @OneToMany(() => MwOrderItem, (i) => i.order, { cascade: ['insert', 'update'] })
  items: MwOrderItem[];

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => MwUser, (user) => user.orders)
  @JoinColumn({ name: 'userId', referencedColumnName: 'erpId' })
  user: MwUser;

  @Column({ type: 'timestamptz' })
  erpUpdatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  erpDeletedAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


