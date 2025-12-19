import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { ProductsService } from './products.service';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(dto: CreateProductDto, file?: Express.Multer.File): Promise<import("./product.entity").Product>;
    findAll(): Promise<import("./product.entity").Product[]>;
    findChanges(cursor?: string, limit?: string): Promise<{
        items: import("./product.entity").Product[];
        nextCursor: string;
    }>;
    update(id: string, dto: UpdateProductDto): Promise<import("./product.entity").Product>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
}
