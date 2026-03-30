import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class WalletChangeDto {
  @IsString()
  @IsNotEmpty()
  asset_type: string;

  @IsNumber()
  amount: number;
}

export class EarnDto {
  @IsString()
  @IsNotEmpty()
  global_user_id: string;

  @IsString()
  @IsNotEmpty()
  biz_type: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WalletChangeDto)
  changes: WalletChangeDto[];

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