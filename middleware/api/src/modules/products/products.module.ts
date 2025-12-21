import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErpModule } from '../integrations/erp/erp.module';
import { RedisModule } from '../integrations/redis/redis.module';
import { MwProduct } from './entities/mw-product.entity';
import { ProductsController } from './products.controller';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';
import { ProductsSyncCron } from './products.sync.cron';

@Module({
  imports: [TypeOrmModule.forFeature([MwProduct]), ErpModule, RedisModule],
  controllers: [ProductsController],
  providers: [ProductsRepository, ProductsService, ProductsSyncCron],
  exports: [ProductsService],
})
export class ProductsModule {}


