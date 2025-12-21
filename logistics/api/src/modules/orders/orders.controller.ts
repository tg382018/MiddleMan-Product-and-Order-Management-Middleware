import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { LogisticsStatus } from './entities/logistics-order.entity';

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Get()
    list() {
        return this.ordersService.listOrders();
    }

    @Post(':id/status')
    updateStatus(
        @Param('id') id: string,
        @Body('status') status: LogisticsStatus,
    ) {
        return this.ordersService.updateStatus(id, status);
    }
}
