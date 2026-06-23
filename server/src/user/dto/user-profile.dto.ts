import { IsOptional, IsBoolean, IsString, IsArray } from 'class-validator';

export class UserProfileDto {
  @IsOptional() @IsBoolean()
  new_user_badge?: boolean;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  interests?: string[];
}
