import { IsInt, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class GenerateLinkDto {
  @IsString()
  @IsNotEmpty()
  global_user_id: string;

  @IsString()
  @IsNotEmpty()
  from_bot: string;

  @IsString()
  @IsNotEmpty()
  to_bot: string;

  @IsString()
  @IsNotEmpty()
  scene: string;

  @IsOptional()
  @IsObject()
  extra_data?: Record<string, any>;

  @IsOptional()
  @IsInt()
  ttl_minutes?: number;
}