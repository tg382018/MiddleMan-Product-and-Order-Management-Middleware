import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ProductsService } from './products.service';

@Injectable()
export class ProductsSyncCron {
  constructor(private readonly productsService: ProductsService) {}

  // Default: every 2 minutes (adjust via CRON_PRODUCTS env)
  @Cron(process.env.CRON_PRODUCTS ?? '*/2 * * * *')
  async handle() {
    await this.productsService.syncFromErpOnce(100);
  }
}


