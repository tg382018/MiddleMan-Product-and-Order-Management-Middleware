import { DataSource, Repository } from 'typeorm';
import { RabbitPublisher } from '../messaging/rabbitmq.publisher';
import { Product } from '../products/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderItem } from './order-item.entity';
import { Order } from './order.entity';
export declare class OrdersService {
    private readonly dataSource;
    private readonly publisher;
    private readonly orderRepo;
    private readonly orderItemRepo;
    private readonly productRepo;
    constructor(dataSource: DataSource, publisher: RabbitPublisher, orderRepo: Repository<Order>, orderItemRepo: Repository<OrderItem>, productRepo: Repository<Product>);
    create(dto: CreateOrderDto): Promise<Order>;
    findAll(): Promise<Order[]>;
    findOne(id: string): Promise<Order>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
    findChanges(cursor?: string, limit?: number): Promise<{
        items: Order[];
        nextCursor: string;
    }>;
}
