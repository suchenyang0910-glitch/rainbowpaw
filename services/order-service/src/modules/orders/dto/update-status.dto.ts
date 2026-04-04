import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;
}

