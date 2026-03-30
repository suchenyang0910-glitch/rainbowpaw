import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SpendDto {
  @IsString()
  @IsNotEmpty()
  global_user_id: string;

  @IsString()
  @IsNotEmpty()
  biz_type: string;

  @IsNumber()
  spend_amount: number;

  @IsOptional()
  @IsString()
  spend_strategy?: string;

  @IsOptional()
  @IsString()
  ref_type?: string;

  @IsOptional()
  @IsString()
  ref_id?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}