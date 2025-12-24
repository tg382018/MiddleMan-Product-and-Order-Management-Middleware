import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { }

    @Get('changes')
    async findChanges(@Query('cursor') cursor?: string, @Query('limit') limit = 100) {
        const safeLimit = Math.max(1, Math.min(500, Number(limit) || 100));

        let cursorUpdatedAt: Date | undefined;
        let cursorId: string | undefined;

        if (cursor) {
            const [updatedAtIso, id] = cursor.split('|');
            const parsed = new Date(updatedAtIso);
            if (!Number.isNaN(parsed.getTime()) && id) {
                cursorUpdatedAt = parsed;
                cursorId = id;
            }
        }

        const qb = this.userRepo
            .createQueryBuilder('u')
            .withDeleted()
            .select(['u.id', 'u.updatedAt'])
            .orderBy("date_trunc('milliseconds', u.updatedAt)", 'ASC')
            .addOrderBy('u.id', 'ASC')
            .take(safeLimit);

        if (cursorUpdatedAt && cursorId) {
            qb.where(
                "(date_trunc('milliseconds', u.updatedAt) > :cursorUpdatedAt) OR (date_trunc('milliseconds', u.updatedAt) = :cursorUpdatedAt AND u.id > :cursorId)",
                { cursorUpdatedAt, cursorId },
            );
        }

        const rows = await qb.getMany();
        const ids = rows.map((r) => r.id); //user id listesi çıkar
        if (!ids.length) return { items: [], nextCursor: null }; // liste boşsa null döner

        const users = await this.userRepo.find({
            where: { id: In(ids) },//idlerle user objeleri gelir
            withDeleted: true, //silinenlerde gelir
        });

        users.sort((a, b) => { //tekrar sıralıyor
            const ta = a.updatedAt.getTime();
            const tb = b.updatedAt.getTime();
            if (ta !== tb) return ta - tb;
            return a.id.localeCompare(b.id);
        });

        const nextCursor = //cursoru güncelliyor
            users.length === safeLimit
                ? `${users[users.length - 1].updatedAt.toISOString()}|${users[users.length - 1].id}`
                : null;

        return { items: users, nextCursor };
    }
}
