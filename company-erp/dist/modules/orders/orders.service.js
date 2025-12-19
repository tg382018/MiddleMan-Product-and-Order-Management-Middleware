"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const rabbitmq_publisher_1 = require("../messaging/rabbitmq.publisher");
const product_entity_1 = require("../products/product.entity");
const order_item_entity_1 = require("./order-item.entity");
const order_status_enum_1 = require("./order-status.enum");
const order_entity_1 = require("./order.entity");
let OrdersService = class OrdersService {
    dataSource;
    publisher;
    orderRepo;
    orderItemRepo;
    productRepo;
    constructor(dataSource, publisher, orderRepo, orderItemRepo, productRepo) {
        this.dataSource = dataSource;
        this.publisher = publisher;
        this.orderRepo = orderRepo;
        this.orderItemRepo = orderItemRepo;
        this.productRepo = productRepo;
    }
    async create(dto) {
        if (!dto.items?.length) {
            throw new common_1.BadRequestException('Order must contain at least 1 item');
        }
        const merged = new Map();
        for (const item of dto.items) {
            merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
        }
        const productIds = Array.from(merged.keys());
        const order = await this.dataSource.transaction(async (manager) => {
            const products = await manager
                .getRepository(product_entity_1.Product)
                .createQueryBuilder('p')
                .setLock('pessimistic_write')
                .where('p.id IN (:...ids)', { ids: productIds })
                .getMany();
            if (products.length !== productIds.length) {
                const found = new Set(products.map((p) => p.id));
                const missing = productIds.filter((id) => !found.has(id));
                throw new common_1.NotFoundException(`Products not found: ${missing.join(', ')}`);
            }
            for (const p of products) {
                const qty = merged.get(p.id) ?? 0;
                if (p.stock < qty) {
                    throw new common_1.BadRequestException(`Insufficient stock for SKU ${p.sku}: requested ${qty}, available ${p.stock}`);
                }
            }
            for (const p of products) {
                const qty = merged.get(p.id) ?? 0;
                p.stock = p.stock - qty;
            }
            await manager.getRepository(product_entity_1.Product).save(products);
            const order = manager.getRepository(order_entity_1.Order).create({
                status: order_status_enum_1.OrderStatus.CREATED,
                totalAmount: 0,
                items: [],
            });
            let total = 0;
            for (const p of products) {
                const qty = merged.get(p.id) ?? 0;
                const unitPrice = Number(p.price);
                if (Number.isNaN(unitPrice)) {
                    throw new common_1.BadRequestException(`Invalid price for product SKU ${p.sku}`);
                }
                const lineTotal = Number((unitPrice * qty).toFixed(2));
                total += lineTotal;
                const oi = manager.getRepository(order_item_entity_1.OrderItem).create({
                    productId: p.id,
                    sku: p.sku,
                    name: p.name,
                    unitPrice,
                    quantity: qty,
                    lineTotal,
                });
                order.items.push(oi);
            }
            order.totalAmount = Number(total.toFixed(2));
            return manager.getRepository(order_entity_1.Order).save(order);
        });
        await this.publisher.publishToQueue('orders.created', {
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
    async findOne(id) {
        const order = await this.orderRepo.findOne({
            where: { id },
            relations: { items: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return order;
    }
    async delete(id) {
        const result = await this.dataSource.transaction(async (manager) => {
            const order = await manager.getRepository(order_entity_1.Order).findOne({
                where: { id },
                relations: { items: true },
            });
            if (!order)
                throw new common_1.NotFoundException('Order not found');
            if (order.deletedAt)
                return { success: true };
            const items = order.items ?? [];
            const productIds = items.map((i) => i.productId);
            if (productIds.length) {
                const products = await manager
                    .getRepository(product_entity_1.Product)
                    .createQueryBuilder('p')
                    .setLock('pessimistic_write')
                    .where('p.id IN (:...ids)', { ids: productIds })
                    .getMany();
                const byId = new Map(products.map((p) => [p.id, p]));
                for (const item of items) {
                    const p = byId.get(item.productId);
                    if (p)
                        p.stock += item.quantity;
                }
                await manager.getRepository(product_entity_1.Product).save(products);
            }
            order.status = order_status_enum_1.OrderStatus.CANCELLED;
            await manager.getRepository(order_entity_1.Order).save(order);
            await manager.getRepository(order_entity_1.Order).softRemove(order);
            return { success: true };
        });
        await this.publisher.publishToQueue('orders.cancelled', {
            orderId: id,
            status: order_status_enum_1.OrderStatus.CANCELLED,
            cancelledAt: new Date().toISOString(),
        });
        return result;
    }
    async findChanges(cursor, limit = 100) {
        const safeLimit = Math.max(1, Math.min(500, Number(limit) || 100));
        let cursorUpdatedAt;
        let cursorId;
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
            qb.where("(date_trunc('milliseconds', o.updatedAt) > :cursorUpdatedAt) OR (date_trunc('milliseconds', o.updatedAt) = :cursorUpdatedAt AND o.id > :cursorId)", { cursorUpdatedAt, cursorId });
        }
        const rows = await qb.getMany();
        const ids = rows.map((r) => r.id);
        if (!ids.length)
            return { items: [], nextCursor: null };
        const orders = await this.orderRepo.find({
            where: { id: (0, typeorm_2.In)(ids) },
            relations: { items: true },
            withDeleted: true,
        });
        orders.sort((a, b) => {
            const ta = a.updatedAt.getTime();
            const tb = b.updatedAt.getTime();
            if (ta !== tb)
                return ta - tb;
            return a.id.localeCompare(b.id);
        });
        const nextCursor = orders.length === safeLimit
            ? `${orders[orders.length - 1].updatedAt.toISOString()}|${orders[orders.length - 1].id}`
            : null;
        return { items: orders, nextCursor };
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(3, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __param(4, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        rabbitmq_publisher_1.RabbitPublisher,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], OrdersService);
//# sourceMappingURL=orders.service.js.map