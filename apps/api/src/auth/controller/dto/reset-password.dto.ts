import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty({ minLength: 9, description: 'Must be more than 8 characters' })
  @IsString()
  @MinLength(9, { message: 'newPassword must be longer than 8 characters' })
  @MaxLength(72)
  newPassword!: string;
}
