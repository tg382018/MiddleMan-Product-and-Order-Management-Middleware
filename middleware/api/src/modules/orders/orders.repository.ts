import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { MwOrderItem } from './entities/mw-order-item.entity';
import { MwOrder, MwOrderStage, MwLogisticsStatus } from './entities/mw-order.entity';

@Injectable()
export class OrdersRepository {
  constructor(
    @InjectRepository(MwOrder)
    private readonly orders: Repository<MwOrder>,
    @InjectRepository(MwOrderItem)
    private readonly items: Repository<MwOrderItem>,
  ) { }

  async upsertFromErp(o: any) {
    const existing = await this.orders.findOne({
      where: { erpId: o.id },
      relations: { items: true },
    });

    const nextOrder: Partial<MwOrder> = {
      erpId: o.id,
      status: o.status,
      totalAmount: Number(o.totalAmount),
      shippingAddress: o.shippingAddress ?? null,
      userId: o.userId ?? null,
      erpUpdatedAt: new Date(o.updatedAt),
      erpDeletedAt: o.deletedAt ? new Date(o.deletedAt) : null,
    };

    const nextItems: MwOrderItem[] = (o.items ?? []).map((i: any) =>
      this.items.create({
        erpProductId: i.productId,
        sku: i.sku,
        name: i.name,
        unitPrice: Number(i.unitPrice),
        quantity: Number(i.quantity),
        lineTotal: Number(i.lineTotal),
      }),
    );

    if (!existing) {
      const created = this.orders.create({
        ...nextOrder,
        stage: MwOrderStage.ERP,
        logisticsStatus: null,
        sentToLogisticsAt: null,
        items: nextItems,
      });
      return this.orders.save(created);
    }

    // replace items snapshot (simple & safe)
    await this.items.delete({ order: { id: existing.id } as any });
    Object.assign(existing, nextOrder);
    existing.items = nextItems;
    return this.orders.save(existing);
  }

  async findPaged(params: { page: number; limit: number; search?: string; stage?: MwOrderStage }) {
    const { page, limit, search, stage } = params;
    const skip = (page - 1) * limit;

    const query = this.orders.createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.user', 'user')
      .where('order.erpDeletedAt IS NULL');

    if (stage) {
      query.andWhere('order.stage = :stage', { stage });
    }

    if (search) {
      query.andWhere(
        '(CAST(order.erpId AS TEXT) ILIKE :search OR order.status ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [items, total] = await query
      .orderBy('order.erpUpdatedAt', 'DESC')
      .take(limit)
      .skip(skip)
      .getManyAndCount();

    return { items, total, page, limit };
  }

  async sendToLogistics(mwOrderId: string) {
    const order = await this.orders.findOne({ where: { id: mwOrderId } });
    if (!order) return null;
    order.stage = MwOrderStage.LOGISTICS;
    order.logisticsStatus = MwLogisticsStatus.PAKET_HAZIRLANIYOR;
    order.sentToLogisticsAt = new Date();
    return this.orders.save(order);
  }

  async getGlobalStats() {
    const [totalOrders, erpStage, logisticsStage] = await Promise.all([
      this.orders.count({ where: { erpDeletedAt: IsNull() } }),
      this.orders.count({ where: { stage: MwOrderStage.ERP, erpDeletedAt: IsNull() } }),
      this.orders.count({ where: { stage: MwOrderStage.LOGISTICS, erpDeletedAt: IsNull() } }),
    ]);

    const result = await this.orders
      .createQueryBuilder('order')
      .select('SUM(CAST(order.totalAmount AS DECIMAL))', 'total')
      .where('order.erpDeletedAt IS NULL')
      .getRawOne();

    return {
      totalOrders,
      erpStage,
      logisticsStage,
      totalAmount: parseFloat(result?.total || '0'),
    };
  }
}


