import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { s3Client } from './s3.config';

@Injectable()
export class MinioService {
  private readonly bucket = process.env.MINIO_BUCKET ?? 'products';

  async upload(file: Express.Multer.File, folder: string) {
    const key = `${folder}/${randomUUID()}-${file.originalname}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const publicBase = (process.env.MINIO_PUBLIC_URL ?? '').replace(/\/$/, '');
    const url = publicBase ? `${publicBase}/${this.bucket}/${key}` : undefined;

    return { key, url };
  }

  async delete(key: string) {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}


