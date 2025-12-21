import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MwOrder, MwLogisticsStatus } from '../orders/entities/mw-order.entity';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { LogisticsGateway } from './logistics.gateway';

@Injectable()
export class LogisticsService {
    private readonly logger = new Logger(LogisticsService.name);

    constructor(
        @InjectRepository(MwOrder)
        private readonly orderRepo: Repository<MwOrder>,
        private readonly amqpConnection: AmqpConnection,
        private readonly logisticsGateway: LogisticsGateway,
    ) { }

    async publishOrderToLogistics(orderId: string) {
        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['items', 'user'],
        });

        if (!order) {
            throw new NotFoundException(`Order with ID ${orderId} not found`);
        }

        this.logger.log(`Publishing order ${orderId} to logistics queue`);

        await this.amqpConnection.publish('company.events', 'orders.to.logistics', {
            orderId: order.id,
            erpId: order.erpId,
            customerName: order.user?.name,
            customerEmail: order.user?.email,
            shippingAddress: order.shippingAddress,
            totalAmount: order.totalAmount,
            items: order.items.map((i) => ({
                sku: i.sku,
                name: i.name,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
            })),
            createdAt: order.createdAt,
        });
    }

    async updateLogisticsStatus(orderId: string, status: MwLogisticsStatus) {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });

        if (!order) {
            throw new NotFoundException(`Order with ID ${orderId} not found`);
        }

        this.logger.log(`Updating order ${orderId} logistics status to ${status}`);

        order.logisticsStatus = status;
        await this.orderRepo.save(order);

        // Push real-time update to dashboard
        this.logisticsGateway.sendStatusUpdate(orderId, status);

        return order;
    }
}
