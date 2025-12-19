import { OrderItem } from './order-item.entity';
import { OrderStatus } from './order-status.enum';
export declare class Order {
    id: string;
    status: OrderStatus;
    totalAmount: number;
    items: OrderItem[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}
