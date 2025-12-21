import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MwUser } from './entities/mw-user.entity';
import { MwOrder } from '../orders/entities/mw-order.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ErpModule } from '../integrations/erp/erp.module';
import { RedisModule } from '../integrations/redis/redis.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([MwUser, MwOrder]),
        ErpModule,
        RedisModule,
    ],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { }
