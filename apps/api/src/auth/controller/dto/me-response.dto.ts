import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';

export class MeResponseDto {
  @ApiProperty({ example: 'clxyz123' })
  id!: string;

  @ApiProperty({ example: 'palos-de-lena' })
  tenantId!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: '12345678' })
  cedula!: string;

  @ApiProperty({ enum: DocumentType, example: DocumentType.CC })
  documentType!: DocumentType;

  @ApiProperty({ example: true })
  emailVerified!: boolean;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: 'OPERATOR' })
  roleCode!: string;

  @ApiProperty()
  createdAt!: Date;
}
