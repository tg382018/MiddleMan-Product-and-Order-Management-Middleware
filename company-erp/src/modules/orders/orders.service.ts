import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { RabbitPublisher } from '../messaging/rabbitmq.publisher';
import { Product } from '../products/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderItem } from './order-item.entity';
import { OrderStatus } from './order-status.enum';
import { Order } from './order.entity';
import { User } from '../users/user.entity';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly publisher: RabbitPublisher,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  async create(dto: CreateOrderDto) {
    if (!dto.items?.length) { //siparişte item var mı 
      throw new BadRequestException('Order must contain at least 1 item');
    }

    // Merge duplicate productId lines
    const merged = new Map<string, number>();
    for (const item of dto.items) {
      merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity); //aynı producttan birden fazla sipariş varsa birleştiriyor
    }// ÖRN 2 ADET PRODUCT1 1 ADET PRODUCT2
    const productIds = Array.from(merged.keys()); // P1 VE P2 IDLERINI VERİYOR

    const order = await this.dataSource.transaction(async (manager) => {
      const products = await manager
        .getRepository(Product)
        .createQueryBuilder('p')
        .setLock('pessimistic_write')
        .where('p.id IN (:...ids)', { ids: productIds })
        .getMany(); // product listesine git ilgili id lerdeki ürünleri dön

      if (products.length !== productIds.length) { //siparişteki ürün çeşit sayısı ile dönen product listesi sayısının kontrlü
        const found = new Set(products.map((p) => p.id));
        const missing = productIds.filter((id) => !found.has(id));
        throw new NotFoundException(`Products not found: ${missing.join(', ')}`);
      }

      for (const p of products) {
        const qty = merged.get(p.id) ?? 0;
        if (p.stock < qty) { //PRODUCT STOK SAYISI SIPARISTEKI STOKDAN KUCUK MUU
          throw new BadRequestException(
            `Insufficient stock for SKU ${p.sku}: requested ${qty}, available ${p.stock}`,
          );
        }
      }

      for (const p of products) { //STOK AZALT
        const qty = merged.get(p.id) ?? 0;
        p.stock = p.stock - qty;
      }
      await manager.getRepository(Product).save(products); //PRODUCT LISTESINI GUNCELLE

      const user = await manager.getRepository(User).findOne({ where: { id: dto.userId } }); //USER VAR MI 
      if (!user) {
        throw new NotFoundException(`User with ID ${dto.userId} not found`);
      }

      const order = manager.getRepository(Order).create({ //SIPARIS AÇ 
        status: OrderStatus.CREATED,
        totalAmount: 0,
        userId: user.id,
        shippingAddress: dto.shippingAddress ?? user.address,
        items: [],
      });

      let total = 0;
      for (const p of products) {
        const qty = merged.get(p.id) ?? 0; //SIPARISTEKI ITEMIN ADEDI
        const unitPrice = Number(p.price); //BIRIM FIYATI
        if (Number.isNaN(unitPrice)) {
          throw new BadRequestException(`Invalid price for product SKU ${p.sku}`);
        }

        const lineTotal = Number((unitPrice * qty).toFixed(2)); //ÇARP
        total += lineTotal; //TOTELE EKLE

        const oi = manager.getRepository(OrderItem).create({ //ORDER ITEM OLUSTUR 
          productId: p.id,
          sku: p.sku,
          name: p.name,
          unitPrice,
          quantity: qty,
          lineTotal,
        });
        order.items.push(oi); //ORDERE ITEMI KOY
      }

      order.totalAmount = Number(total.toFixed(2)); //YUKARDAKI FOR TOPLAM TOTALAMOUNTA YAZ
      return manager.getRepository(Order).save(order); //BITIR
    });

    // outbox yok (best-effort)
    await this.publisher.publishToQueue('orders.created', { //RABITMQ YA HABER VERIYOR 
      orderId: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    });

    return order;
  }

  async findAll() {
    return this.orderRepo.find({
      relations: { items: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async delete(id: string) {
    const result = await this.dataSource.transaction(async (manager) => {
      const order = await manager.getRepository(Order).findOne({ //ORDER LISTESINDE SIPARISI BUL
        where: { id },
        relations: { items: true },
      });
      if (!order) throw new NotFoundException('Order not found');
      if (order.deletedAt) return { success: true }; //ZATEN SILINMIŞSE AŞAĞI GİRMEZ

      const items = order.items ?? []; //ITEMLERI ÇEK
      const productIds = items.map((i) => i.productId); //ITEMLERIN PRODUCTID LERINI AL 

      if (productIds.length) {
        const products = await manager
          .getRepository(Product)
          .createQueryBuilder('p')
          .setLock('pessimistic_write')
          .where('p.id IN (:...ids)', { ids: productIds }) //ıtemdekı product ıd lerdekı productları dön
          .getMany();

        const byId = new Map(products.map((p) => [p.id, p])); //product listesini byId ye ekliyor
        for (const item of items) { //itemler
          const p = byId.get(item.productId); //byId deki her id için item listesindeki productu bul
          if (p) p.stock += item.quantity; //böylece p stoğunu itemdeki kadar atrırır
        }
        await manager.getRepository(Product).save(products);
      }

      order.status = OrderStatus.CANCELLED; //REPOYU GUNCELLIYOR
      await manager.getRepository(Order).save(order);
      await manager.getRepository(Order).softRemove(order);
      return { success: true };
    });

    await this.publisher.publishToQueue('orders.cancelled', { //RABBITE HABER EDIYOR
      orderId: id,
      status: OrderStatus.CANCELLED,
      cancelledAt: new Date().toISOString(),
    });

    return result;
  }

  async findChanges(cursor?: string, limit = 100) {
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

    const qb = this.orderRepo
      .createQueryBuilder('o')
      .withDeleted()
      .select(['o.id', 'o.updatedAt'])
      .orderBy("date_trunc('milliseconds', o.updatedAt)", 'ASC')
      .addOrderBy('o.id', 'ASC')
      .take(safeLimit);

    if (cursorUpdatedAt && cursorId) {
      qb.where(
        "(date_trunc('milliseconds', o.updatedAt) > :cursorUpdatedAt) OR (date_trunc('milliseconds', o.updatedAt) = :cursorUpdatedAt AND o.id > :cursorId)",
        { cursorUpdatedAt, cursorId },
      );
    }

    const rows = await qb.getMany();
    const ids = rows.map((r) => r.id);
    if (!ids.length) return { items: [], nextCursor: null };

    const orders = await this.orderRepo.find({
      where: { id: In(ids) },
      relations: { items: true },
      withDeleted: true,
    });

    orders.sort((a, b) => {
      const ta = a.updatedAt.getTime();
      const tb = b.updatedAt.getTime();
      if (ta !== tb) return ta - tb;
      return a.id.localeCompare(b.id);
    });

    const nextCursor =
      orders.length === safeLimit
        ? `${orders[orders.length - 1].updatedAt.toISOString()}|${orders[orders.length - 1].id}`
        : null;

    return { items: orders, nextCursor };
  }
}


