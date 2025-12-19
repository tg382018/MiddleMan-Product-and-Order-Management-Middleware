import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
type PublishPayload = Record<string, unknown>;
export declare class RabbitPublisher implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private client?;
    private channel?;
    private readonly exchange;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    publish(routingKey: string, payload: PublishPayload): Promise<void>;
    publishToQueue(queueName: string, payload: PublishPayload): Promise<void>;
}
export {};
