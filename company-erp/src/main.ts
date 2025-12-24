import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({ //tüm controllerlarda validation (dto veri doğrulaması)
      whitelist: true,//istekde field dto da yoksa siler
      forbidNonWhitelisted: true,//istekde field dto da yoksa hata verir
      transform: true,//request body i dtoya döndürür
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

bootstrap();
