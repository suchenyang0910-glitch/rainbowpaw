import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('store')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('categories')
  async listCategories() {
    const result = await this.productsService.listCategories();
    return { code: 0, data: { items: result } };
  }

  @Get('products')
  async listProducts(@Query('category_id') categoryId?: string) {
    const result = await this.productsService.listProducts(categoryId, true);
    return { code: 0, data: { items: result } };
  }

  @Get('products/:productId')
  async getProduct(@Param('productId') productId: string) {
    const result = await this.productsService.getProduct(productId);
    return { code: 0, data: result };
  }

  @Post('products')
  async createProduct(@Body() dto: any) {
    const result = await this.productsService.createProduct(dto);
    return { code: 0, data: result };
  }

  @Post('products/:productId/inventory')
  async adjustInventory(
    @Param('productId') productId: string,
    @Body() dto: { change_amount: number; reason: string; reference_id?: string },
  ) {
    const result = await this.productsService.adjustInventory(
      productId,
      dto.change_amount,
      dto.reason,
      dto.reference_id,
    );
    return { code: 0, data: result };
  }
}
