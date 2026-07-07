import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ example: '847291' })
  @IsString()
  @Length(6, 6)
  otpCode!: string;
}
