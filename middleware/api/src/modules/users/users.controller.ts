import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    async list() {
        return this.usersService.list();
    }

    @Get('stats')
    async getStats() {
        return this.usersService.getStats();
    }

    @Get(':id/orders')
    async getUserOrders(@Param('id') id: string) {
        return this.usersService.getUserOrders(id);
    }

    @Get('sync')
    async sync() {
        return this.usersService.syncFromErpOnce();
    }
}
