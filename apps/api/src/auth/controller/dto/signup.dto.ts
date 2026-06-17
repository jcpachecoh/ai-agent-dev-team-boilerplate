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

  @ApiProperty({ example: 'strongPassword123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
