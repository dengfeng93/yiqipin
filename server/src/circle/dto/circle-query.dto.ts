import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CircleQueryDto {
  @Type(() => Number) @IsNumber()
  lat!: number;

  @Type(() => Number) @IsNumber()
  lng!: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(50)
  range?: number = 10;

  @IsOptional() @IsString()
  category_id?: string;

  @IsOptional() @IsEnum(['now', 'today', 'tomorrow'])
  time_filter?: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  instant?: number;
}
