import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomBytes } from 'crypto';
import { ProductEntity } from './entities/product.entity';
import { ProductCategoryEntity } from './entities/product-category.entity';
import { InventoryLogEntity } from './entities/inventory-log.entity';

@Injectable()
export class ProductsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(ProductCategoryEntity)
    private readonly categoryRepo: Repository<ProductCategoryEntity>,
    @InjectRepository(InventoryLogEntity)
    private readonly inventoryLogRepo: Repository<InventoryLogEntity>,
  ) {}

  private generateId(prefix: string) {
    return `${prefix}_${randomBytes(8).toString('hex')}`;
  }

  async listCategories() {
    return this.categoryRepo.find({
      where: { is_active: true },
      order: { sort_order: 'ASC', created_at: 'ASC' },
    });
  }

  async listProducts(categoryId?: string, activeOnly: boolean = true) {
    const where: any = {};
    if (activeOnly) where.is_active = true;
    if (categoryId) where.category_id = categoryId;

    return this.productRepo.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  async getProduct(productId: string) {
    const product = await this.productRepo.findOne({ where: { product_id: productId } });
    if (!product) throw new NotFoundException('product not found');
    return product;
  }

  async createProduct(dto: any) {
    const productId = this.generateId('p');
    const product = this.productRepo.create({
      product_id: productId,
      category_id: dto.category_id,
      name: dto.name,
      description: dto.description || null,
      price: String(dto.price),
      currency: dto.currency || 'points',
      stock: Number(dto.stock) || 0,
      cover_image: dto.cover_image || null,
      images: dto.images || null,
      is_active: dto.is_active !== undefined ? dto.is_active : true,
      metadata: dto.metadata || null,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return this.productRepo.save(product);
  }

  async adjustInventory(productId: string, changeAmount: number, reason: string, refId?: string) {
    return this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(ProductEntity);
      const logRepo = manager.getRepository(InventoryLogEntity);

      const product = await productRepo.findOne({ where: { product_id: productId } });
      if (!product) throw new NotFoundException('product not found');

      const before = product.stock;
      const after = before + changeAmount;
      if (after < 0) throw new BadRequestException('insufficient stock');

      product.stock = after;
      product.updated_at = new Date();
      await productRepo.save(product);

      await logRepo.save(
        logRepo.create({
          product_id: productId,
          change_amount: changeAmount,
          balance_before: before,
          balance_after: after,
          reason,
          reference_id: refId || null,
          created_at: new Date(),
        })
      );

      return product;
    });
  }
}
