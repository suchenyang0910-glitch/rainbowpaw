import { IsOptional } from 'class-validator';

export class RiskAnalyzeDto {
  @IsOptional()
  user_behavior?: any;

  @IsOptional()
  wallet_logs?: any;

  @IsOptional()
  claw_plays?: any;
}
