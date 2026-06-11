import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateAdminUserDto {
  @ApiProperty({ example: 'Juan Carlos Pérez' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '12345678' })
  @IsString()
  @IsNotEmpty()
  cedula!: string;

  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  documentType!: DocumentType;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'role-id' })
  @IsString()
  @IsNotEmpty()
  roleId!: string;
}
