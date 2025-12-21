import { Controller, Post, Body, Param } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { MwLogisticsStatus } from '../orders/entities/mw-order.entity';

@Controller('logistics')
export class LogisticsController {
    constructor(private readonly logisticsService: LogisticsService) { }

    @Post('status-update/:orderId')
    async updateStatus(
        @Param('orderId') orderId: string,
        @Body('status') status: MwLogisticsStatus,
    ) {
        return this.logisticsService.updateLogisticsStatus(orderId, status);
    }
}
