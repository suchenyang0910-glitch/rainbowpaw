import { IsIn, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

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
}
