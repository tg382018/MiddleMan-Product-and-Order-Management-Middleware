import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MwOrder } from './mw-order.entity';

@Entity('mw_order_items')
export class MwOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MwOrder, (o) => o.items, { onDelete: 'CASCADE' })
  order: MwOrder;

  @Column({ type: 'uuid' })
  erpProductId: string;

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


