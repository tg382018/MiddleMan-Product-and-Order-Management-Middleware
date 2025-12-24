import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CreateProductDto, UpdateProductDto } from './dto/create-update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),//ram e yolluyor
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  create(@Body() dto: CreateProductDto, @UploadedFile() file?: Express.Multer.File) {
    return this.productsService.create(dto, file);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get('changes')
  findChanges(@Query('cursor') cursor?: string, @Query('limit') limit?: string) {
    return this.productsService.findChanges(cursor, limit ? Number(limit) : undefined);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}


