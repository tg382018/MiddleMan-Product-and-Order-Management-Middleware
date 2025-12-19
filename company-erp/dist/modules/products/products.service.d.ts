import { Repository } from 'typeorm';
import { MinioService } from '../minio/minio.service';
import { Product } from './product.entity';
export declare class ProductsService {
    private readonly productRepo;
    private readonly minioService;
    constructor(productRepo: Repository<Product>, minioService: MinioService);
    create(data: Partial<Product>, file?: Express.Multer.File): Promise<Product>;
    findAll(): Promise<Product[]>;
    update(id: string, data: Partial<Product>): Promise<Product>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
    findChanges(cursor?: string, limit?: number): Promise<{
        items: Product[];
        nextCursor: string;
    }>;
}
