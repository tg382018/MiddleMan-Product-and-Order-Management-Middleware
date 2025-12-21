import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor() {
    const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
    this.client = new Redis(url, { lazyConnect: true });
  }

  async get(key: string) {
    await this.client.connect().catch(() => undefined);
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    await this.client.connect().catch(() => undefined);
    if (ttlSeconds) return this.client.set(key, value, 'EX', ttlSeconds);
    return this.client.set(key, value);
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
    } catch (err) {
      this.logger.warn('Redis quit failed (ignored)');
    }
  }
}


