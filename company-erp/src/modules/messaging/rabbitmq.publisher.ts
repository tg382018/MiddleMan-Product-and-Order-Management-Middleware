import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import amqp, { Channel, ChannelModel } from 'amqplib';

type PublishPayload = Record<string, unknown>;

@Injectable()
export class RabbitPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitPublisher.name);
  private client?: ChannelModel;
  private channel?: Channel;

  private readonly exchange = process.env.RABBITMQ_EXCHANGE ?? 'company.events';

  async onModuleInit() {
    const url = process.env.RABBITMQ_URL;
    if (!url) {
      this.logger.warn('RABBITMQ_URL not set; events will NOT be published');
      return;
    }

    try {
      const client = await amqp.connect(url);
      const channel = await client.createChannel();
      await channel.assertExchange(this.exchange, 'topic', { durable: true });

      this.client = client;
      this.channel = channel;
      this.logger.log(`RabbitMQ connected; exchange="${this.exchange}"`);
    } catch (err) {
      this.logger.error('RabbitMQ connection failed; events will NOT be published', err as Error);
      this.client = undefined;
      this.channel = undefined;
    }
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
    } catch {
      // ignore
    }
    try {
      await this.client?.close();
    } catch {
      // ignore
    }
  }

  /**
   * Fire-and-forget publish (no outbox). Never throws to the caller.
   */
  async publish(routingKey: string, payload: PublishPayload) {
    if (!this.channel) return;
    try {
      const body = Buffer.from(JSON.stringify(payload));
      this.channel.publish(this.exchange, routingKey, body, {
        contentType: 'application/json',
        persistent: true,
        timestamp: Date.now(),
      });
    } catch {
      this.logger.warn(`Publish failed for "${routingKey}" (ignored)`);
    }
  }

  /**
   * Fire-and-forget queue publish (no exchange/bindings needed). Never throws to the caller.
   */
  async publishToQueue(queueName: string, payload: PublishPayload) {
    if (!this.channel) return;
    try {
      await this.channel.assertQueue(queueName, { durable: true });
      const body = Buffer.from(JSON.stringify(payload));
      this.channel.sendToQueue(queueName, body, {
        contentType: 'application/json',
        persistent: true,
        timestamp: Date.now(),
      });
    } catch {
      this.logger.warn(`Queue publish failed for "${queueName}" (ignored)`);
    }
  }
}


