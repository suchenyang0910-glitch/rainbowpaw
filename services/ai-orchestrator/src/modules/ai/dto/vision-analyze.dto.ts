import { IsOptional, IsString } from 'class-validator';

export class VisionAnalyzeDto {
  @IsString()
  image_url!: string;

  @IsOptional()
  @IsString()
  task?: string;
}
