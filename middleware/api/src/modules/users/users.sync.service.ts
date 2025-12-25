import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from './users.service';

@Injectable()
export class UsersSyncService {
    private readonly logger = new Logger(UsersSyncService.name);

    constructor(private readonly usersService: UsersService) { }

    @Cron(CronExpression.EVERY_HOUR)
    async syncUsers() {
        this.logger.log('Starting scheduled users sync...');
        try {
            const result = await this.usersService.syncFromErpOnce(100);
            if (result.upserts > 0) {
                this.logger.log(`Synced ${result.upserts} users from ERP (pages: ${result.pages})`);
            } else {
                this.logger.debug('No new changes from ERP');
            }
        } catch (err) {
            this.logger.error('Failed to sync users from ERP', err);
        }
    }
}
