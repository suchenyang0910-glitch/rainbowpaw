import { IsIn, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsOptional()
  @IsString()
  product_id?: string;

  @IsString()
  @IsNotEmpty()
  item_name: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unit_price: number;

  @IsNumber()
  total_price: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  order_id?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['claw', 'product', 'service'])
  type: string;

  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  @IsIn(['points', 'usd'])
  currency?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(['income', 'expense'])
  flow?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];
}
