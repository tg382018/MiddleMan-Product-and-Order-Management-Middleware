import { Injectable } from '@nestjs/common';
import { ErpClientService } from '../integrations/erp/erp-client.service';
import { RedisService } from '../integrations/redis/redis.service';
import { ProductsRepository } from './products.repository';

@Injectable()
export class ProductsService {
  constructor(
    private readonly repo: ProductsRepository,
    private readonly erp: ErpClientService,
    private readonly redis: RedisService,
  ) { }

  async list(params: { page: number; limit: number; search?: string }) {
    return this.repo.findPaged(params);
  }

  /**
   * Pull-based sync using company-erp change feed.
   * Keeps cursor in Redis (fallback: start from null).
   */
  async syncFromErpOnce(limit = 100) { //bana her istekte 100 değişiklik verebilirsin
    const cursorKey = 'sync:products:cursor';
    const startCursor = await this.redis.get(cursorKey);

    let cursor: string | undefined = startCursor || undefined;
    let pages = 0;
    let upserts = 0;

    while (true) {
      const feed = await this.erp.getProductChanges(cursor, limit);//COMPANY'DEN DEĞİŞİKLİKLERİ ALIYOR
      for (const p of feed.items) {//HER DEĞİŞİKLİĞİ UPSERT EDİYOR
        await this.repo.upsertFromErp(p);
        upserts++;
      }

      pages++; //batch sayısı 
      if (!feed.nextCursor) break;
      cursor = feed.nextCursor;

      // keep cursor advancing even if crash happens mid-run
      await this.redis.set(cursorKey, cursor);

      // guardrail
      if (pages > 1000) break;
    }

    if (cursor) await this.redis.set(cursorKey, cursor);

    return { pages, upserts, cursor: cursor ?? null };
  }
}


