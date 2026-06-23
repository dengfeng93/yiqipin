import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { StartType, RestrictTag } from '../entities/circle.entity';

export class CreateCircleDto {
  @IsString() @IsNotEmpty()
  category_id!: string;

  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;

  @IsOptional() @IsString()
  address?: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(10)
  range_km?: number = 3;

  @IsOptional() @Type(() => Number) @IsInt() @Min(2) @Max(100)
  max_members?: number;

  @IsOptional() @Type(() => Date)
  start_time?: Date = new Date();

  @IsOptional() @Type(() => Number) @IsInt()
  prep_time?: number = 0;

  @IsOptional() @IsEnum(StartType)
  start_type?: StartType = StartType.NOW;

  @IsOptional() @IsEnum(RestrictTag)
  restrict_tag?: RestrictTag = RestrictTag.ALL;

  @IsOptional() @IsString()
  group_rule?: string;
}
