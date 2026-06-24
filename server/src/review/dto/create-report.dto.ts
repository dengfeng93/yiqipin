import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateReportDto {
  @IsString() @IsOptional()
  target_user_id?: string;

  @IsString() @IsOptional()
  circle_id?: string;

  @IsString() @IsNotEmpty() @MaxLength(30)
  type!: string;

  @IsString() @IsNotEmpty()
  reason!: string;

  @IsString() @IsOptional()
  detail?: string;
}
