import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MwUser } from './entities/mw-user.entity';
import { MwOrder } from '../orders/entities/mw-order.entity';
import { ErpClientService } from '../integrations/erp/erp-client.service';
import { RedisService } from '../integrations/redis/redis.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(MwUser)
        private readonly userRepo: Repository<MwUser>,
        @InjectRepository(MwOrder)
        private readonly orderRepo: Repository<MwOrder>,
        private readonly erp: ErpClientService,
        private readonly redis: RedisService,
    ) { }

    async list() {
        return this.userRepo.find({
            order: { name: 'ASC' },
        });
    }

    async getUserOrders(userId: string) {
        return this.orderRepo.find({
            where: { userId },
            relations: { items: true },
            order: { erpUpdatedAt: 'DESC' },
        });
    }

    async getStats() {
        const stats = await this.orderRepo
            .createQueryBuilder('o')
            .select('o.userId', 'userId')
            .addSelect('u.name', 'userName')
            .addSelect('COUNT(o.id)', 'orderCount')
            .addSelect('SUM(o.totalAmount)', 'totalSpent')
            .innerJoin('o.user', 'u')
            .groupBy('o.userId')
            .addGroupBy('u.name')
            .getRawMany();

        return stats;
    }

    async syncFromErpOnce(limit = 100) {
        const cursorKey = 'sync:users:cursor';
        const startCursor = await this.redis.get(cursorKey);

        let cursor: string | undefined = startCursor || undefined;
        let pages = 0;
        let upserts = 0;

        while (true) {
            const feed = await this.erp.getUserChanges(cursor, limit);
            for (const u of feed.items) {
                await this.upsertFromErp(u);
                upserts++;
            }

            pages++;
            if (!feed.nextCursor) break;
            cursor = feed.nextCursor;
            await this.redis.set(cursorKey, cursor);
            if (pages > 100) break;
        }

        if (cursor) await this.redis.set(cursorKey, cursor);
        return { pages, upserts, cursor: cursor ?? null };
    }

    private async upsertFromErp(u: any) {
        const existing = await this.userRepo.findOne({ where: { erpId: u.id } });
        const data = {
            erpId: u.id,
            name: u.name,
            email: u.email,
            address: u.address,
        };

        if (existing) {
            Object.assign(existing, data);
            return this.userRepo.save(existing);
        } else {
            const created = this.userRepo.create(data);
            return this.userRepo.save(created);
        }
    }
}
