export declare class MinioService {
    private readonly bucket;
    upload(file: Express.Multer.File, folder: string): Promise<{
        key: string;
        url: string;
    }>;
    delete(key: string): Promise<void>;
}
