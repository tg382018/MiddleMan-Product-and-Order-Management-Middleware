import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListProductsQueryDto } from './dto/list-products.query';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(@Query() query: ListProductsQueryDto) { //search parametrelerini dto ile doğrulayıp service gönderir
    return this.productsService.list({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      search: query.search,
    });
  }
}


