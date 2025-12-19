export declare class Product {
    id: string;
    sku: string;
    name: string;
    description?: string;
    stock: number;
    price: number;
    imageKey?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}
