import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum LogisticsStatus {
    PAKET_HAZIRLANIYOR = 'PAKET_HAZIRLANIYOR',
    MERKEZ_SUBEDE = 'MERKEZ_SUBEDE',
    SEHIRE_ULASTI = 'SEHIRE_ULASTI',
    DAGITIMDA = 'DAGITIMDA',
    TESLIM_EDILDI = 'TESLIM_EDILDI',
    IPTAL_OLDU = 'IPTAL_OLDU',
}

@Entity('logistics_orders')
export class LogisticsOrder {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    middlewareOrderId: string;

    @Column({ type: 'uuid' })
    erpOrderId: string;

    @Column()
    customerName: string;

    @Column()
    customerEmail: string;

    @Column({ type: 'jsonb' })
    shippingAddress: any;

    @Column('decimal', { precision: 12, scale: 2 })
    totalAmount: number;

    @Column({ type: 'jsonb' })
    items: any[];

    @Column({
        type: 'enum',
        enum: LogisticsStatus,
        default: LogisticsStatus.PAKET_HAZIRLANIYOR,
    })
    status: LogisticsStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
