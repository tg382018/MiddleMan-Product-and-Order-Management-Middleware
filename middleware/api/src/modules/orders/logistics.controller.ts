import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListOrdersQueryDto } from './dto/list-orders.query';
import { OrdersService } from './orders.service';

@ApiTags('logistics')
@Controller('logistics')
export class LogisticsController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * "Lojistik bekleme listesi" (for now: local state in middleware DB).
   */
  @Get('waiting')
  listWaiting(@Query() query: ListOrdersQueryDto) {
    return this.ordersService.listLogisticsWaiting({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      search: query.search,
    });
  }
}


