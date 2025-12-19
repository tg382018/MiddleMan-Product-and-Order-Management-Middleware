import { Order } from './order.entity';
export declare class OrderItem {
    id: string;
    order: Order;
    productId: string;
    sku: string;
    name: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    createdAt: Date;
}
