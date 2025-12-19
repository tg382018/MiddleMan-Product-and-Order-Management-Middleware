import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MinioService } from '../minio/minio.service';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly minioService: MinioService,
  ) {}

  async create(data: Partial<Product>, file?: Express.Multer.File) {
    const exists = await this.productRepo.findOne({ where: { sku: data.sku } });
    if (exists) throw new ConflictException('SKU already exists');

    let imageKey: string | undefined;
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

  async update(id: string, data: Partial<Product>) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    if (data.sku && data.sku !== product.sku) {
      const skuExists = await this.productRepo.findOne({ where: { sku: data.sku } });
      if (skuExists) throw new ConflictException('SKU already exists');
    }

    Object.assign(product, data);
    return this.productRepo.save(product);
  }

  async delete(id: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    if (product.imageKey) {
      await this.minioService.delete(product.imageKey);
    }

    await this.productRepo.softRemove(product);
    return { success: true };
  }

  /**
   * Cursor-based change feed for middleware sync.
   * Cursor format: "{updatedAtISO}|{id}"
   */
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

    const qb = this.productRepo
      .createQueryBuilder('p')
      .withDeleted()
      .orderBy("date_trunc('milliseconds', p.updatedAt)", 'ASC')
      .addOrderBy('p.id', 'ASC')
      .take(safeLimit);

    if (cursorUpdatedAt && cursorId) {
      qb.where(
        "(date_trunc('milliseconds', p.updatedAt) > :cursorUpdatedAt) OR (date_trunc('milliseconds', p.updatedAt) = :cursorUpdatedAt AND p.id > :cursorId)",
        { cursorUpdatedAt, cursorId },
      );
    }

    const items = await qb.getMany();
    const nextCursor =
      items.length === safeLimit
        ? `${items[items.length - 1].updatedAt.toISOString()}|${items[items.length - 1].id}`
        : null;

    return { items, nextCursor };
  }
}


