import { IsString, IsOptional, IsInt, IsDate, Min, Max } from 'class-validator';

export class UpdateCircleDto {
  @IsString() @IsOptional()
  title?: string;

  @IsString() @IsOptional()
  description?: string;

  @IsString() @IsOptional()
  address?: string;

  @IsInt() @Min(2) @Max(100) @IsOptional()
  max_members?: number;

  @IsDate() @IsOptional()
  start_time?: Date;

  @IsInt() @Min(0) @IsOptional()
  prep_time?: number;

  @IsString() @IsOptional()
  group_rule?: string;

  @IsString() @IsOptional()
  restrict_tag?: string;
}
