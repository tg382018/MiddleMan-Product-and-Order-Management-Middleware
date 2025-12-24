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
    const exists = await this.productRepo.findOne({ where: { sku: data.sku } }); //DATADAKI SKU DB DE VAR MI 
    if (exists) throw new ConflictException('SKU already exists');//VARSA ALREADY EXIST

    let imageKey: string | undefined;
    if (file) {
      const upload = await this.minioService.upload(file, 'products'); //
      imageKey = upload.key; //MINIO UPLOAD A IMG URL YAZIYOR
    }

    const product = this.productRepo.create({ ...data, imageKey }); //ORM KAYIT YAPIYOR
    return this.productRepo.save(product); //VE ÜRÜNÜ RETIRN EDİYORUZ
  }

  async findAll() {
    return this.productRepo.find(); // HEPSİNİ GETİREN ORM FONKSİYONU
  }

  async update(id: string, data: Partial<Product>) {
    const product = await this.productRepo.findOne({ where: { id } }); //SKU YU KONTROL EDER GİBİ ID YI KONTROL EDIYORUZ VAR MI DIYE 
    if (!product) throw new NotFoundException('Product not found');

    if (data.sku && data.sku !== product.sku) { //sku değiştirmek istersek
      const skuExists = await this.productRepo.findOne({ where: { sku: data.sku } });
      if (skuExists) throw new ConflictException('SKU already exists');
    }

    Object.assign(product, data); // ÜSTÜNE YAZIYOR DEĞİŞİKLİK YAPIYOR
    return this.productRepo.save(product); //RETURN YAPIYOR
  }

  async delete(id: string) {
    const product = await this.productRepo.findOne({ where: { id } }); // ürünü arıyor
    if (!product) throw new NotFoundException('Product not found');

    if (product.imageKey) { //İMAGE İ SİLİYOR
      await this.minioService.delete(product.imageKey);
    }

    await this.productRepo.softRemove(product); //DELETED =TRUE YAPYIOR
    return { success: true };
  }

  /**
   * Cursor-based change feed for middleware sync.
   * Cursor format: "{updatedAtISO}|{id}"
   */
  async findChanges(cursor?: string, limit = 100) {
    const safeLimit = Math.max(1, Math.min(500, Number(limit) || 100)); // limit yoksa 100 1 den küçükse 1 500 den büyükse 500

    let cursorUpdatedAt: Date | undefined; // tiplerini belirtiyoruz
    let cursorId: string | undefined;

    if (cursor) {
      const [updatedAtIso, id] = cursor.split('|'); // X | Y şeklindeki cursoru ayrıştırıp x ve y yi alıyoruz
      const parsed = new Date(updatedAtIso); // X İ normal date e çeviriyor çünkü stringdi 
      if (!Number.isNaN(parsed.getTime()) && id) { // tarih geçerli mi ve id var mı 
        cursorUpdatedAt = parsed;
        cursorId = id;
      }
    }

    const qb = this.productRepo
      .createQueryBuilder('p') //sorguya takma ad ver
      .withDeleted() // silinenleri de dahil et 
      .orderBy("date_trunc('milliseconds', p.updatedAt)", 'ASC') //güncellenme tarihine göre verileri sırala 
      .addOrderBy('p.id', 'ASC') 
      .take(safeLimit); // en fazla safe limit tarihine kaadar kayıt getir

    if (cursorUpdatedAt && cursorId) {
      qb.where( // kayıt getirirken cursordaki son zamandan daha sonra güncellenenleri sorgula
        "(date_trunc('milliseconds', p.updatedAt) > :cursorUpdatedAt) OR (date_trunc('milliseconds', p.updatedAt) = :cursorUpdatedAt AND p.id > :cursorId)",
        { cursorUpdatedAt, cursorId },
      );
    }

    const items = await qb.getMany(); //sonuçları getir
    const nextCursor =
      items.length === safeLimit // safelimit sayısını middleware a dönüyor örneğin 500 den fazla update varsa middleware burayı tekrar çalıtıracaktır
        ? `${items[items.length - 1].updatedAt.toISOString()}|${items[items.length - 1].id}`
        : null;

    return { items, nextCursor };
  }
}


