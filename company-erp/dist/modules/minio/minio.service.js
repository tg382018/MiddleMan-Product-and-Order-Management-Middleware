"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinioService = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const s3_config_1 = require("./s3.config");
let MinioService = class MinioService {
    bucket = process.env.MINIO_BUCKET ?? 'products';
    async upload(file, folder) {
        const key = `${folder}/${(0, crypto_1.randomUUID)()}-${file.originalname}`;
        await s3_config_1.s3Client.send(new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        }));
        const publicBase = (process.env.MINIO_PUBLIC_URL ?? '').replace(/\/$/, '');
        const url = publicBase ? `${publicBase}/${this.bucket}/${key}` : undefined;
        return { key, url };
    }
    async delete(key) {
        await s3_config_1.s3Client.send(new client_s3_1.DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        }));
    }
};
exports.MinioService = MinioService;
exports.MinioService = MinioService = __decorate([
    (0, common_1.Injectable)()
], MinioService);
//# sourceMappingURL=minio.service.js.map