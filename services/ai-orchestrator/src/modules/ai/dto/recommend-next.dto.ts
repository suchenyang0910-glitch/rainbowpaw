import { IsOptional } from 'class-validator';

export class RecommendNextDto {
  @IsOptional()
  user_profile?: any;

  @IsOptional()
  recent_actions?: any;

  @IsOptional()
  last_result?: any;

  @IsOptional()
  candidate_products?: any;

  @IsOptional()
  candidate_entries?: any;
}
