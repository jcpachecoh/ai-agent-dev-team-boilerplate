import { ApiPropertyOptional } from '@nestjs/swagger';
import { AssetStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateEmployeeAssetDto {
  @ApiPropertyOptional({ enum: AssetStatus, description: 'Nuevo estado del activo' })
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @ApiPropertyOptional({ description: 'Valor actualizado en COP' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  value?: number;

  @ApiPropertyOptional({ description: 'Observaciones (ej. motivo de retorno o baja)' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'ID del StorageObject para reemplazar o adjuntar archivo' })
  @IsOptional()
  @IsString()
  storageObjectId?: string;
}
