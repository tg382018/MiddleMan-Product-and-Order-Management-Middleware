import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessagingModule } from './modules/messaging/messaging.module';
import { MinioModule } from './modules/minio/minio.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ProductsModule } from './modules/products/products.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ProductsModule,
    OrdersModule,
    MessagingModule,
    UsersModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      // When in docker-compose, DB_HOST is "postgres"; local dev defaults to localhost:5433.
      host: process.env.DB_HOST ?? 'localhost',
      //DB YE DOCKERDAN MI LOCALDEN MI BAGLANAYIM
      port: process.env.DB_PORT
        ? Number(process.env.DB_PORT)
        : (process.env.DB_HOST ?? 'localhost') === 'localhost'
          ? 5433
          : 5432,
          //ENV DE PORT VARSA KULLAN , YOKSA ENV HOSTU LOCALHOST ISE 5433 DEGILSE 5432(DOCKER)
      username: process.env.DB_USER ?? 'company',
      password: process.env.DB_PASS ?? 'company123',
      database: process.env.DB_NAME ?? 'company_db',
      autoLoadEntities: true,
      synchronize: (process.env.TYPEORM_SYNC ?? 'true') === 'true',
    }),
    MinioModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
