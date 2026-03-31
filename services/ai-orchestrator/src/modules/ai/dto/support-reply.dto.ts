import { IsObject, IsOptional, IsString } from 'class-validator';

export class SupportReplyDto {
  @IsString()
  user_message!: string;

  @IsOptional()
  @IsObject()
  user_profile?: any;

  @IsOptional()
  @IsObject()
  context?: any;
}
