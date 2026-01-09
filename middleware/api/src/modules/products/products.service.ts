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

  async list(params: { page: number; limit: number; search?: string }) { //list parametrelerini controllerdan alıp repo service yolluyor
    return this.repo.findPaged(params);
  }

  /**
    ERP SERVICEDEKI GETPRODUCTCHANGES İLE DEĞİŞİKLİKLERİ ALIR
    PRODUCT REPOSITORYDEKI UPSERTFROMERP İLE MIDDLEWARE DB Yİ GÜNCELLER 
   */
  async syncFromErpOnce(limit = 100) { //bana her istekte 100 değişiklik verebilirsin
    const cursorKey = 'sync:products:cursor';
    const startCursor = await this.redis.get(cursorKey); //EN SONKİ CURSORDA TARIH VAR 

    let cursor: string | undefined = startCursor || undefined;
    let pages = 0;
    let upserts = 0;

    while (true) {
      const feed = await this.erp.getProductChanges(cursor, limit);//COMPANY'DEN TARİHİ GÖNDERERK DEĞİŞİKLİKLERİ ALIYOR
      for (const p of feed.items) {//HER DEĞİŞİKLİĞİ UPSERT EDİYOR
        await this.repo.upsertFromErp(p);
        upserts++;
      }

      pages++; //batch sayısı DİĞER İSTEĞE GEÇİYORUZ
      if (!feed.nextCursor) break; // COMPANY EĞER DEĞİŞİKLİK KALMADIYSA CURSORU NULL YAPIYOR BURASIDA BUNU FARKEDİP FONKSİYONU KAPATIYOR
      cursor = feed.nextCursor;//HALA DEĞİŞİKLİK VARSA YENİ CURSORU COMPANYDEN ALIYOR

      // keep cursor advancing even if crash happens mid-run
      await this.redis.set(cursorKey, cursor); //YENI CURSORU REDISE KAYDEDIYOR

      // guardrail
      if (pages > 1000) break;
    }

    if (cursor) await this.redis.set(cursorKey, cursor);

    return { pages, upserts, cursor: cursor ?? null }; //LOG İÇİN 
  }
}


