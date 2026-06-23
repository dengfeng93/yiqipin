import { IsString, IsOptional, IsArray, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional() @IsString() @MaxLength(50)
  nickname?: string;

  @IsOptional() @IsString()
  avatar?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  interests?: string[];
}
