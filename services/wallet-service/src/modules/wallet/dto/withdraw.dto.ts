import { IsNotEmpty, IsNumber, IsObject, IsString } from 'class-validator';

export class WithdrawDto {
  @IsString()
  @IsNotEmpty()
  global_user_id: string;

  @IsNumber()
  points_cashable_amount: number;

  @IsString()
  @IsNotEmpty()
  method: string;

  @IsObject()
  account_info: Record<string, any>;
}