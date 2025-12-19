import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  @Index()
  @Column({ type: 'uuid' })
  productId: string;

  @Column()
  sku: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 12, scale: 2 })
  unitPrice: number;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 12, scale: 2 })
  lineTotal: number;

  @CreateDateColumn()
  createdAt: Date;
}
