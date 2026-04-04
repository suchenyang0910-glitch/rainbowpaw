import { IsInt, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class BridgeEventDto {
  @IsString()
  @IsNotEmpty()
  event_name: string;

  @IsString()
  @IsNotEmpty()
  global_user_id: string;

  @IsString()
  @IsNotEmpty()
  source_bot: string;

  @IsOptional()
  @IsString()
  idempotency_key?: string;

  @IsOptional()
  @IsString()
  source_user_id?: string;

  @IsOptional()
  @IsInt()
  telegram_id?: number;

  @IsOptional()
  @IsObject()
  event_data?: Record<string, any>;
}
