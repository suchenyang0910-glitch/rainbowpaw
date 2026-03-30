import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class RecycleDto {
  @IsString()
  @IsNotEmpty()
  global_user_id: string;

  @IsString()
  @IsNotEmpty()
  biz_type: string;

  @IsNumber()
  origin_amount: number;

  @IsNumber()
  recycle_amount: number;

  @IsObject()
  split_rule: {
    locked_ratio: number;
    cashable_ratio: number;
  };

  @IsOptional()
  @IsString()
  ref_type?: string;

  @IsOptional()
  @IsString()
  ref_id?: string;
}