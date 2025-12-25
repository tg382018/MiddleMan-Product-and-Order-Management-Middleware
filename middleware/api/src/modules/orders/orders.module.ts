import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErpModule } from '../integrations/erp/erp.module';
import { RedisModule } from '../integrations/redis/redis.module';
import { MwOrderItem } from './entities/mw-order-item.entity';
import { MwOrder } from './entities/mw-order.entity';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';
import { OrdersSyncService } from './orders.sync.service';
import { LogisticsModule } from '../logistics/logistics.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([MwOrder, MwOrderItem]),
    ErpModule,
    RedisModule,
    forwardRef(() => LogisticsModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersRepository, OrdersService, OrdersSyncService],
  exports: [OrdersService],
})
export class OrdersModule { }


