export declare class CreateProductDto {
    sku: string;
    name: string;
    description?: string;
    stock: number;
    price: number;
}
export declare class UpdateProductDto {
    sku?: string;
    name?: string;
    description?: string;
    stock?: number;
    price?: number;
}
