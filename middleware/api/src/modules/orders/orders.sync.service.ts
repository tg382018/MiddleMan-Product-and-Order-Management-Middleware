import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrdersService } from './orders.service';

@Injectable()
export class OrdersSyncService {
    private readonly logger = new Logger(OrdersSyncService.name);

    constructor(private readonly ordersService: OrdersService) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async syncOrders() {
        this.logger.log('Starting scheduled orders sync...');
        try {
            const result = await this.ordersService.syncFromErpOnce(100);
            if (result.upserts > 0) {
                this.logger.log(`Synced ${result.upserts} orders from ERP (pages: ${result.pages})`);
            } else {
                this.logger.debug('No new changes from ERP');
            }
        } catch (err) {
            this.logger.error('Failed to sync orders from ERP', err);
        }
    }
}
