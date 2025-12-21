import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { MwOrder } from '../../orders/entities/mw-order.entity';

@Entity('mw_users')
export class MwUser {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index({ unique: true })
    @Column({ type: 'uuid' })
    erpId: string;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column({ type: 'jsonb' })
    address: any;

    @OneToMany(() => MwOrder, (order) => order.user)
    orders: MwOrder[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
