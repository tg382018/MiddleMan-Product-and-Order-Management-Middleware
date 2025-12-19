"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RabbitPublisher_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitPublisher = void 0;
const common_1 = require("@nestjs/common");
const amqplib_1 = require("amqplib");
let RabbitPublisher = RabbitPublisher_1 = class RabbitPublisher {
    logger = new common_1.Logger(RabbitPublisher_1.name);
    client;
    channel;
    exchange = process.env.RABBITMQ_EXCHANGE ?? 'company.events';
    async onModuleInit() {
        const url = process.env.RABBITMQ_URL;
        if (!url) {
            this.logger.warn('RABBITMQ_URL not set; events will NOT be published');
            return;
        }
        try {
            const client = await amqplib_1.default.connect(url);
            const channel = await client.createChannel();
            await channel.assertExchange(this.exchange, 'topic', { durable: true });
            this.client = client;
            this.channel = channel;
            this.logger.log(`RabbitMQ connected; exchange="${this.exchange}"`);
        }
        catch (err) {
            this.logger.error('RabbitMQ connection failed; events will NOT be published', err);
            this.client = undefined;
            this.channel = undefined;
        }
    }
    async onModuleDestroy() {
        try {
            await this.channel?.close();
        }
        catch {
        }
        try {
            await this.client?.close();
        }
        catch {
        }
    }
    async publish(routingKey, payload) {
        if (!this.channel)
            return;
        try {
            const body = Buffer.from(JSON.stringify(payload));
            this.channel.publish(this.exchange, routingKey, body, {
                contentType: 'application/json',
                persistent: true,
                timestamp: Date.now(),
            });
        }
        catch {
            this.logger.warn(`Publish failed for "${routingKey}" (ignored)`);
        }
    }
    async publishToQueue(queueName, payload) {
        if (!this.channel)
            return;
        try {
            await this.channel.assertQueue(queueName, { durable: true });
            const body = Buffer.from(JSON.stringify(payload));
            this.channel.sendToQueue(queueName, body, {
                contentType: 'application/json',
                persistent: true,
                timestamp: Date.now(),
            });
        }
        catch {
            this.logger.warn(`Queue publish failed for "${queueName}" (ignored)`);
        }
    }
};
exports.RabbitPublisher = RabbitPublisher;
exports.RabbitPublisher = RabbitPublisher = RabbitPublisher_1 = __decorate([
    (0, common_1.Injectable)()
], RabbitPublisher);
//# sourceMappingURL=rabbitmq.publisher.js.map