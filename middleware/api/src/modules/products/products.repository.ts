import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { MwProduct } from './entities/mw-product.entity';

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectRepository(MwProduct)
    private readonly repo: Repository<MwProduct>,
  ) { }

  async upsertFromErp(p: {
    id: string;
    sku: string;
    name: string;
    description?: string | null;
    stock: number;
    price: number | string;
    imageKey?: string | null;
    updatedAt: string;
    deletedAt?: string | null;
  }) {
    const existing = await this.repo.findOne({ where: { erpId: p.id } });

    const next: Partial<MwProduct> = {
      erpId: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description ?? undefined,
      stock: Number(p.stock),
      price: Number(p.price),
      imageKey: p.imageKey ?? undefined,
      erpUpdatedAt: new Date(p.updatedAt),
      erpDeletedAt: p.deletedAt ? new Date(p.deletedAt) : null,
    };

    if (!existing) {
      return this.repo.save(this.repo.create(next));
    }

    Object.assign(existing, next);
    return this.repo.save(existing);
  }

  async findPaged(params: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where = search
      ? [
        { sku: ILike(`%${search}%`), erpDeletedAt: null },
        { name: ILike(`%${search}%`), erpDeletedAt: null },
      ]
      : { erpDeletedAt: null };

    const [items, total] = await this.repo.findAndCount({
      where: where as any,
      order: { erpUpdatedAt: 'DESC' },
      take: limit,
      skip,
    });

    return { items, total, page, limit };
  }
}


