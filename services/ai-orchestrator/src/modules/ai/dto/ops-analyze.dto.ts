import { IsOptional } from 'class-validator';

export class OpsAnalyzeDto {
  @IsOptional()
  report?: any;

  @IsOptional()
  metrics?: any;
}

