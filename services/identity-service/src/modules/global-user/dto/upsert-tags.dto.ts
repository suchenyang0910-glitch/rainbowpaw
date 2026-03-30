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

class TagItemDto {
  @IsString()
  @IsNotEmpty()
  tag_key: string;

  @IsOptional()
  @IsString()
  tag_value?: string;

  @IsOptional()
  @IsNumber()
  score?: number;
}

export class UpsertTagsDto {
  @IsString()
  @IsNotEmpty()
  global_user_id: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TagItemDto)
  tags: TagItemDto[];
}