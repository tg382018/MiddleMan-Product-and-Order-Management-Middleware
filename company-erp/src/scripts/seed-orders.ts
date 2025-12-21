import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { OrdersService } from '../modules/orders/orders.service';
import { ProductsService } from '../modules/products/products.service';
import { getArgNumber, pickOne, randInt, sleep } from './seed-utils';
import { User } from '../modules/users/user.entity';
import { Repository } from 'typeorm';

type ProductLite = { id: string; stock: number };


async function main() {
  const count = getArgNumber('count', 500);
  const maxItems = getArgNumber('maxItems', 3);
  const maxQty = getArgNumber('maxQty', 3);

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    const productsService = app.get(ProductsService);
    const ordersService = app.get(OrdersService);

    const products = (await productsService.findAll()) as unknown as ProductLite[];
    const available = products.filter((p) => Number(p.stock) > 0);

    if (!available.length) {
      console.log('No products with stock found. Seed products first.');
      return;
    }

    const userRepo = app.get<Repository<User>>('UserRepository');
    const users = await userRepo.find();
    if (!users.length) {
      console.log('No users found. Seed users first.');
      return;
    }

    let created = 0;
    let attempts = 0;

    while (created < count) {
      attempts++;

      const itemCount = Math.max(1, Math.min(maxItems, randInt(1, maxItems)));
      const chosen = new Set<string>();
      const items: { productId: string; quantity: number }[] = [];

      for (let i = 0; i < itemCount; i++) {
        const p = pickOne(available);
        if (chosen.has(p.id)) continue;
        chosen.add(p.id);

        const qty = Math.max(1, Math.min(maxQty, randInt(1, maxQty), Number(p.stock)));
        if (qty <= 0) continue;
        items.push({ productId: p.id, quantity: qty });
      }

      if (!items.length) {
        await sleep(10);
        continue;
      }

      try {
        const user = pickOne(users);
        await ordersService.create({ items, userId: user.id });
        created++;
        if (created % 25 === 0) {
          console.log(`Created ${created}/${count} orders... (attempts=${attempts})`);
        }
      } catch {
        await sleep(5);
      }
    }

    console.log(`Done. Created ${created} orders. (attempts=${attempts})`);
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
