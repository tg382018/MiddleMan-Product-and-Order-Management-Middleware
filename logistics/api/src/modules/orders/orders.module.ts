import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { LogisticsOrder } from './entities/logistics-order.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([LogisticsOrder]),
        HttpModule,
    ],
    controllers: [OrdersController],
    providers: [OrdersService],
})
export class OrdersModule { }
