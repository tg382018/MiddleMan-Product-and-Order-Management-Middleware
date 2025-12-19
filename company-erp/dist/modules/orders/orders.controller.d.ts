import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(dto: CreateOrderDto): Promise<import("./order.entity").Order>;
    findAll(): Promise<import("./order.entity").Order[]>;
    findChanges(cursor?: string, limit?: string): Promise<{
        items: import("./order.entity").Order[];
        nextCursor: string;
    }>;
    findOne(id: string): Promise<import("./order.entity").Order>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
}
