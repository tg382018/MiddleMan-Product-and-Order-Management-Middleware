import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { OrderStatus } from './order-status.enum';
import { User } from '../users/user.entity';
import { ManyToOne, JoinColumn } from 'typeorm';

export type ShippingAddress = {
  fullName: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
};

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.CREATED }) // ORDERIN STATUSLARI , DEFAULT CREATED
  status: OrderStatus;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  /**
   * Order-level shipping address.
   * (This is intentionally not per-item; 99% of B2B flows ship per order.)
   */
  @Column({ type: 'jsonb', nullable: true })
  shippingAddress?: ShippingAddress | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: ['insert'] })
  items: OrderItem[];

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date | null;
}
