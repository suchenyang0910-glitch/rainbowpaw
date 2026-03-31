import { IsOptional, IsString } from 'class-validator';

export class GrowthGenerateDto {
  @IsOptional()
  campaign?: any;

  @IsOptional()
  metrics?: any;

  @IsOptional()
  @IsString()
  goal?: string;
}
