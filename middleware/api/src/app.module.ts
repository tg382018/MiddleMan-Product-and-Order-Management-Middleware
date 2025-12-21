import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { RabbitMqModule } from './modules/integrations/rabbitmq/rabbitmq.module';
import { UsersModule } from './modules/users/users.module';
import { StatsModule } from './modules/stats/stats.module';
import { LogisticsModule } from './modules/logistics/logistics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
      },
    }),
    ScheduleModule.forRoot(),
    HttpModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.MW_DB_HOST ?? 'localhost',
      port: process.env.MW_DB_PORT ? Number(process.env.MW_DB_PORT) : 5434,
      username: process.env.MW_DB_USER ?? 'middleware',
      password: process.env.MW_DB_PASS ?? 'middleware123',
      database: process.env.MW_DB_NAME ?? 'middleware_db',
      autoLoadEntities: true,
      synchronize: (process.env.MW_DB_SYNC ?? 'true') === 'true',
    }),
    ProductsModule,
    OrdersModule,
    RabbitMqModule,
    UsersModule,
    StatsModule,
    LogisticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
