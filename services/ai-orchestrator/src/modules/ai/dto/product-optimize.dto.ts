import { IsOptional } from 'class-validator';

export class ProductOptimizeDto {
  @IsOptional()
  products?: any;

  @IsOptional()
  claw_price?: any;

  @IsOptional()
  current_pool?: any;

  @IsOptional()
  user_preference?: any;
}

