import { Injectable } from '@nestjs/common';
import { ErpClientService } from '../integrations/erp/erp-client.service';
import { RedisService } from '../integrations/redis/redis.service';
import { OrdersRepository } from './orders.repository';
import { MwOrderStage } from './entities/mw-order.entity';
import { LogisticsService } from '../logistics/logistics.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly repo: OrdersRepository,
    private readonly erp: ErpClientService,
    private readonly redis: RedisService,
    private readonly logisticsService: LogisticsService,
  ) { }

  async list(params: { page: number; limit: number; search?: string; stage?: string }) {
    return this.repo.findPaged({
      ...params,
      stage: params.stage as MwOrderStage | undefined
    });
  }

  async listLogisticsWaiting(params: { page: number; limit: number; search?: string }) {
    return this.repo.findPaged({ ...params, stage: MwOrderStage.LOGISTICS }); //LOJISTIGE GONDERILMEYI BEKLEYEN 
  }

  async sendToLogistics(mwOrderId: string) {
    const updated = await this.repo.sendToLogistics(mwOrderId); //SEND LOGISTIC
    if (updated) {
      await this.logisticsService.publishOrderToLogistics(mwOrderId);//RABBITMQ 
      return { ok: true };
    }
    return { ok: false, reason: 'ORDER_NOT_FOUND' };
  }

  async getStats() {
    return this.repo.getGlobalStats();
  }

  async syncFromErpOnce(limit = 100) {
    const cursorKey = 'sync:orders:cursor';
    const startCursor = await this.redis.get(cursorKey);

    let cursor: string | undefined = startCursor || undefined;
    let pages = 0;
    let upserts = 0;

    while (true) {
      const feed = await this.erp.getOrderChanges(cursor, limit);
      for (const o of feed.items) {
        await this.repo.upsertFromErp(o);
        upserts++;
      }

      pages++;
      if (!feed.nextCursor) break;
      cursor = feed.nextCursor;
      await this.redis.set(cursorKey, cursor);
      if (pages > 1000) break;
    }

    if (cursor) await this.redis.set(cursorKey, cursor);
    return { pages, upserts, cursor: cursor ?? null };
  }

  /**
   * Used by RabbitMQ consumer: fetch latest order state and upsert.
   */
  async syncOrderById(erpOrderId: string) {
    const order = await this.erp.getOrderById(erpOrderId);
    await this.repo.upsertFromErp(order);
    return { ok: true };
  }
}


