import { DocumentType } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '12345678' })
  @IsString()
  @MaxLength(20)
  cedula!: string;

  @ApiProperty({ enum: DocumentType, example: DocumentType.CC })
  @IsEnum(DocumentType)
  documentType!: DocumentType;

  @ApiPropertyOptional({ example: 'OPERATOR', default: 'OPERATOR' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  roleCode?: string;

  @ApiProperty({
    example: 'strongPassword123',
    minLength: 9,
    description: 'Must be more than 8 characters',
  })
  @IsString()
  @MinLength(9, { message: 'password must be longer than 8 characters' })
  @MaxLength(72)
  password!: string;
}
