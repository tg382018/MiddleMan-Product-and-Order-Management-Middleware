"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const messaging_module_1 = require("./modules/messaging/messaging.module");
const minio_module_1 = require("./modules/minio/minio.module");
const orders_module_1 = require("./modules/orders/orders.module");
const products_module_1 = require("./modules/products/products.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            products_module_1.ProductsModule,
            orders_module_1.OrdersModule,
            messaging_module_1.MessagingModule,
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DB_HOST ?? 'localhost',
                port: process.env.DB_PORT
                    ? Number(process.env.DB_PORT)
                    : (process.env.DB_HOST ?? 'localhost') === 'localhost'
                        ? 5433
                        : 5432,
                username: process.env.DB_USER ?? 'company',
                password: process.env.DB_PASS ?? 'company123',
                database: process.env.DB_NAME ?? 'company_db',
                autoLoadEntities: true,
                synchronize: (process.env.TYPEORM_SYNC ?? 'true') === 'true',
            }),
            minio_module_1.MinioModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map