"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const orders_service_1 = require("../modules/orders/orders.service");
const products_service_1 = require("../modules/products/products.service");
const seed_utils_1 = require("./seed-utils");
async function main() {
    const count = (0, seed_utils_1.getArgNumber)('count', 500);
    const maxItems = (0, seed_utils_1.getArgNumber)('maxItems', 3);
    const maxQty = (0, seed_utils_1.getArgNumber)('maxQty', 3);
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, {
        logger: ['log', 'warn', 'error'],
    });
    try {
        const productsService = app.get(products_service_1.ProductsService);
        const ordersService = app.get(orders_service_1.OrdersService);
        const products = (await productsService.findAll());
        const available = products.filter((p) => Number(p.stock) > 0);
        if (!available.length) {
            console.log('No products with stock found. Seed products first.');
            return;
        }
        let created = 0;
        let attempts = 0;
        while (created < count) {
            attempts++;
            const itemCount = Math.max(1, Math.min(maxItems, (0, seed_utils_1.randInt)(1, maxItems)));
            const chosen = new Set();
            const items = [];
            for (let i = 0; i < itemCount; i++) {
                const p = (0, seed_utils_1.pickOne)(available);
                if (chosen.has(p.id))
                    continue;
                chosen.add(p.id);
                const qty = Math.max(1, Math.min(maxQty, (0, seed_utils_1.randInt)(1, maxQty), Number(p.stock)));
                if (qty <= 0)
                    continue;
                items.push({ productId: p.id, quantity: qty });
            }
            if (!items.length) {
                await (0, seed_utils_1.sleep)(10);
                continue;
            }
            try {
                await ordersService.create({ items });
                created++;
                if (created % 25 === 0) {
                    console.log(`Created ${created}/${count} orders... (attempts=${attempts})`);
                }
            }
            catch {
                await (0, seed_utils_1.sleep)(5);
            }
        }
        console.log(`Done. Created ${created} orders. (attempts=${attempts})`);
    }
    finally {
        await app.close();
    }
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=seed-orders.js.map