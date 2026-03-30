import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LinkUserDto {
  @IsString()
  @IsNotEmpty()
  source_bot: string;

  @IsString()
  @IsNotEmpty()
  source_user_id: string;

  @IsOptional()
  @IsInt()
  telegram_id?: number;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  first_source?: string;
}