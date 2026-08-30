import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupplierDocumentType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';

export class SupplierDocumentParamDto {
  @ApiProperty({ enum: SupplierDocumentType })
  @IsEnum(SupplierDocumentType)
  documentType!: SupplierDocumentType;
}

export class UpsertSupplierDocumentDto {
  @ApiProperty({ description: 'Storage object id returned by /api/storage/upload' })
  @IsString()
  storageObjectId!: string;

  @ApiPropertyOptional({ description: 'Issue date (YYYY-MM-DD)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  issuedAt?: Date;

  @ApiPropertyOptional({ description: 'Expiration date (YYYY-MM-DD)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;
}
