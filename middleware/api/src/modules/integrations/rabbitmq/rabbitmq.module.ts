import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { OrdersModule } from '../../orders/orders.module';
import { RabbitConsumerService } from './rabbit-consumer.service';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    forwardRef(() => OrdersModule),
    RabbitMQModule.forRoot({
      exchanges: [
        {
          name: process.env.RABBITMQ_EXCHANGE ?? 'company.events',
          type: 'topic',
        },
      ],
      uri: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
      connectionInitOptions: { wait: false },
    }),
  ],
  providers: [RabbitConsumerService],
  exports: [RabbitMQModule],
})
export class RabbitMqModule { }


