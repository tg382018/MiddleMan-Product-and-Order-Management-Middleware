import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogisticsOrder, LogisticsStatus } from './entities/logistics-order.entity';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        @InjectRepository(LogisticsOrder)
        private readonly orderRepo: Repository<LogisticsOrder>,
        private readonly httpService: HttpService,
    ) { }

    @RabbitSubscribe({
        exchange: process.env.RABBITMQ_EXCHANGE ?? 'company.events',
        routingKey: 'orders.to.logistics',
        queue: 'logistics.orders.queue',
    })
    async handleOrderFromMiddleware(data: any) {
        this.logger.log(`Received order from middleware: ${data.orderId}`);

        const existing = await this.orderRepo.findOne({
            where: { middlewareOrderId: data.orderId },
        });

        if (existing) {
            this.logger.warn(`Order ${data.orderId} already exists in logistics`);
            return;
        }

        const order = this.orderRepo.create({
            middlewareOrderId: data.orderId,
            erpOrderId: data.erpId,
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            shippingAddress: data.shippingAddress,
            totalAmount: data.totalAmount,
            items: data.items,
            status: LogisticsStatus.PAKET_HAZIRLANIYOR,
        });

        await this.orderRepo.save(order);
        this.logger.log(`Order ${data.orderId} saved to logistics database`);
    }

    async listOrders() {
        return this.orderRepo.find({ order: { createdAt: 'DESC' } });
    }

    async updateStatus(id: string, status: LogisticsStatus) {
        const order = await this.orderRepo.findOne({ where: { id } });
        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }

        order.status = status;
        await this.orderRepo.save(order);

        this.logger.log(`Order ${id} status updated to ${status}. Notifying middleware...`);

        // Notify middleware via Webhook
        try {
            const middlewareUrl = process.env.MIDDLEWARE_API_URL ?? 'http://middleware-api:3002';
            await firstValueFrom(
                this.httpService.post(`${middlewareUrl}/logistics/status-update/${order.middlewareOrderId}`, {
                    status: order.status,
                }),
            );
            this.logger.log(`Middleware notified successfully for order ${id}`);
        } catch (err) {
            this.logger.error(`Failed to notify middleware for order ${id}`, err as Error);
        }

        return order;
    }
}
