import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ErpClientService } from './erp-client.service';

@Module({
  imports: [HttpModule],
  providers: [ErpClientService],
  exports: [ErpClientService],
})
export class ErpModule {}


