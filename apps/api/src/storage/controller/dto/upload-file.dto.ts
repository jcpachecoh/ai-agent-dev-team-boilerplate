import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ImageProfile, StorageDomain, StorageVisibility } from '../../enums/storage.enums';

export class UploadFileDto {
  @ApiProperty({ enum: StorageDomain, description: 'Módulo o dominio al que pertenece el archivo' })
  @IsEnum(StorageDomain)
  domain!: StorageDomain;

  @ApiPropertyOptional({
    enum: ImageProfile,
    description: 'Perfil de procesamiento de imagen. Ignorado para PDFs.',
  })
  @IsOptional()
  @IsEnum(ImageProfile)
  imageProfile?: ImageProfile;

  @ApiPropertyOptional({ description: 'Tipo de entidad asociada (ej: tenant, user, recipe)' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  entityType?: string;

  @ApiPropertyOptional({ description: 'ID de la entidad asociada' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  entityId?: string;

  @ApiPropertyOptional({ enum: StorageVisibility, default: StorageVisibility.PUBLIC })
  @IsOptional()
  @IsEnum(StorageVisibility)
  visibility?: StorageVisibility;
}
