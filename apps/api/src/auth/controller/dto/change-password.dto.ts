import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentPass123!' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({
    minLength: 9,
    example: 'NewStrongPass123!',
    description: 'Must be more than 8 characters',
  })
  @IsString()
  @MinLength(9, { message: 'newPassword must be longer than 8 characters' })
  @MaxLength(72)
  newPassword!: string;
}
