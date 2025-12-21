import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogisticsController } from './logistics.controller';
import { LogisticsService } from './logistics.service';
import { LogisticsGateway } from './logistics.gateway';
import { MwOrder } from '../orders/entities/mw-order.entity';
import { RabbitMqModule } from '../integrations/rabbitmq/rabbitmq.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([MwOrder]),
        forwardRef(() => RabbitMqModule),
    ],
    controllers: [LogisticsController],
    providers: [LogisticsService, LogisticsGateway],
    exports: [LogisticsService],
})
export class LogisticsModule { }
