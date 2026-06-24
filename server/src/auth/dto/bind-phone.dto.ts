import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class BindPhoneDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^1[3-9]\d{9}$/)
  phone!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;
}
