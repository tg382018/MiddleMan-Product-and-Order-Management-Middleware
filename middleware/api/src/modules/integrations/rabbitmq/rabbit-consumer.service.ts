import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import amqp, { Channel, Connection, ConsumeMessage } from 'amqplib';
import { OrdersService } from '../../orders/orders.service';

@Injectable()
export class RabbitConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitConsumerService.name);
  private conn?: Connection;
  private channel?: Channel;

  constructor(private readonly ordersService: OrdersService) {}

  private get url() {
    return process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';
  }

  async onModuleInit() {
    try {
      this.conn = await amqp.connect(this.url);
      this.channel = await this.conn.createChannel();

      await this.channel.assertQueue('orders.created', { durable: true });
      await this.channel.assertQueue('orders.cancelled', { durable: true });

      await this.channel.consume('orders.created', (msg) => this.handle(msg), {
        noAck: false,
      });
      await this.channel.consume('orders.cancelled', (msg) => this.handle(msg), {
        noAck: false,
      });

      this.logger.log('RabbitMQ consumer started');
    } catch (err) {
      this.logger.error('RabbitMQ consumer init failed', err as Error);
    }
  }

  private async handle(msg: ConsumeMessage | null) {
    if (!msg || !this.channel) return;

    try {
      const raw = msg.content.toString('utf8');
      let payload: { orderId?: string };
      try {
        payload = JSON.parse(raw);
      } catch {
        // Poison message (not JSON) -> drop
        this.logger.warn('Invalid JSON message; ack and drop');
        this.channel.ack(msg);
        return;
      }
      const orderId = payload.orderId;

      if (orderId) {
        await this.ordersService.syncOrderById(orderId);
      }

      this.channel.ack(msg);
    } catch (err) {
      // Likely transient (DB not ready, ERP temporarily down). Requeue to retry.
      this.logger.warn('Message processing failed; nack with requeue=true');
      this.channel.nack(msg, false, true);
    }
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
    } catch {
      // ignore
    }
    try {
      await this.conn?.close();
    } catch {
      // ignore
    }
  }
}


