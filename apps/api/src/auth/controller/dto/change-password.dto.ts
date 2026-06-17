import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentPass123!' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ minLength: 8, example: 'NewStrongPass123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}
