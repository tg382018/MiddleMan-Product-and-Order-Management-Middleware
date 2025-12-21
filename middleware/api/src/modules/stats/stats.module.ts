import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { MwOrder } from '../orders/entities/mw-order.entity';
import { MwUser } from '../users/entities/mw-user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([MwOrder, MwUser])],
    controllers: [StatsController],
    providers: [StatsService],
})
export class StatsModule { }
