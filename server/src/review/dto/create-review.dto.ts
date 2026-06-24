import { IsString, IsBoolean, IsOptional, IsArray, IsNotEmpty } from 'class-validator';

export class CreateReviewDto {
  @IsString() @IsNotEmpty()
  target_user_id!: string;

  @IsString() @IsNotEmpty()
  circle_id!: string;

  @IsBoolean()
  showed_up!: boolean;

  @IsArray() @IsString({ each: true }) @IsOptional()
  tags?: string[];

  @IsString() @IsOptional()
  comment?: string;
}
