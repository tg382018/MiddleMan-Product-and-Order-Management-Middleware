import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListOrdersQueryDto } from './dto/list-orders.query';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Get()
  list(@Query() query: ListOrdersQueryDto) {
    return this.ordersService.list({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      search: query.search,
    });
  }

  @Post(':id/send-to-logistics')
  sendToLogistics(@Param('id') id: string) {
    return this.ordersService.sendToLogistics(id);
  }

  @Get('sync')
  sync() {
    return this.ordersService.syncFromErpOnce();
  }
}


