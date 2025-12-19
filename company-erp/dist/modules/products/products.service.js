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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const minio_service_1 = require("../minio/minio.service");
const product_entity_1 = require("./product.entity");
let ProductsService = class ProductsService {
    productRepo;
    minioService;
    constructor(productRepo, minioService) {
        this.productRepo = productRepo;
        this.minioService = minioService;
    }
    async create(data, file) {
        const exists = await this.productRepo.findOne({ where: { sku: data.sku } });
        if (exists)
            throw new common_1.ConflictException('SKU already exists');
        let imageKey;
        if (file) {
            const upload = await this.minioService.upload(file, 'products');
            imageKey = upload.key;
        }
        const product = this.productRepo.create({ ...data, imageKey });
        return this.productRepo.save(product);
    }
    async findAll() {
        return this.productRepo.find();
    }
    async update(id, data) {
        const product = await this.productRepo.findOne({ where: { id } });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        if (data.sku && data.sku !== product.sku) {
            const skuExists = await this.productRepo.findOne({ where: { sku: data.sku } });
            if (skuExists)
                throw new common_1.ConflictException('SKU already exists');
        }
        Object.assign(product, data);
        return this.productRepo.save(product);
    }
    async delete(id) {
        const product = await this.productRepo.findOne({ where: { id } });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        if (product.imageKey) {
            await this.minioService.delete(product.imageKey);
        }
        await this.productRepo.softRemove(product);
        return { success: true };
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
        const qb = this.productRepo
            .createQueryBuilder('p')
            .withDeleted()
            .orderBy("date_trunc('milliseconds', p.updatedAt)", 'ASC')
            .addOrderBy('p.id', 'ASC')
            .take(safeLimit);
        if (cursorUpdatedAt && cursorId) {
            qb.where("(date_trunc('milliseconds', p.updatedAt) > :cursorUpdatedAt) OR (date_trunc('milliseconds', p.updatedAt) = :cursorUpdatedAt AND p.id > :cursorId)", { cursorUpdatedAt, cursorId });
        }
        const items = await qb.getMany();
        const nextCursor = items.length === safeLimit
            ? `${items[items.length - 1].updatedAt.toISOString()}|${items[items.length - 1].id}`
            : null;
        return { items, nextCursor };
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        minio_service_1.MinioService])
], ProductsService);
//# sourceMappingURL=products.service.js.map