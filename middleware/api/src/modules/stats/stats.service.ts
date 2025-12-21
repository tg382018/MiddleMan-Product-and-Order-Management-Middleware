import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MwOrder } from '../orders/entities/mw-order.entity';
import { MwUser } from '../users/entities/mw-user.entity';

@Injectable()
export class StatsService {
    constructor(
        @InjectRepository(MwOrder)
        private readonly orderRepo: Repository<MwOrder>,
        @InjectRepository(MwUser)
        private readonly userRepo: Repository<MwUser>,
    ) { }

    async getDashboardStats() {
        const orders = await this.orderRepo.find({
            relations: ['user'],
        });

        // 1. Orders per User (Top 10)
        const userStatsMap = new Map<string, { name: string; count: number }>();
        orders.forEach((o) => {
            if (o.user) {
                const stats = userStatsMap.get(o.user.id) || { name: o.user.name, count: 0 };
                stats.count++;
                userStatsMap.set(o.user.id, stats);
            }
        });
        const ordersPerUser = Array.from(userStatsMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // 2. Orders per City
        const cityStatsMap = new Map<string, number>();
        orders.forEach((o) => {
            const city = o.shippingAddress?.city || 'Unknown';
            cityStatsMap.set(city, (cityStatsMap.get(city) || 0) + 1);
        });
        const ordersPerCity = Array.from(cityStatsMap.entries()).map(([city, count]) => ({
            city,
            count,
        }));

        // 3. Orders by Price Brackets
        const brackets = [
            { label: '0-100', min: 0, max: 100, count: 0 },
            { label: '100-500', min: 100, max: 500, count: 0 },
            { label: '500-1000', min: 500, max: 1000, count: 0 },
            { label: '1000+', min: 1000, max: Infinity, count: 0 },
        ];
        orders.forEach((o) => {
            const amount = Number(o.totalAmount);
            const bracket = brackets.find((b) => amount >= b.min && amount < b.max);
            if (bracket) bracket.count++;
        });

        // 4. Orders by Date (Last 30 days)
        const dateStatsMap = new Map<string, number>();
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            dateStatsMap.set(dateStr, 0);
        }

        orders.forEach((o) => {
            const dateStr = new Date(o.createdAt).toISOString().split('T')[0];
            if (dateStatsMap.has(dateStr)) {
                dateStatsMap.set(dateStr, dateStatsMap.get(dateStr)! + 1);
            }
        });
        const ordersByDate = Array.from(dateStatsMap.entries()).map(([date, count]) => ({
            date,
            count,
        }));

        return {
            ordersPerUser,
            ordersPerCity,
            ordersByPrice: brackets.map((b) => ({ label: b.label, count: b.count })),
            ordersByDate,
        };
    }
}
