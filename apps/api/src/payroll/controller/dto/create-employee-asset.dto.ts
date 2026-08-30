import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateEmployeeAssetDto {
  @ApiProperty({ description: 'ID del empleado (EmployeeDetails.id)' })
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @ApiProperty({
    description: 'Nombre o descripción del activo',
    example: 'Computador portátil Dell XPS',
  })
  @IsString()
  @IsNotEmpty()
  assetName!: string;

  @ApiProperty({ enum: AssetType, description: 'Categoría del activo' })
  @IsEnum(AssetType)
  type!: AssetType;

  @ApiProperty({ description: 'Valor del activo en COP', example: 3500000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  value!: number;

  @ApiPropertyOptional({ description: 'Fecha de asignación (ISO 8601). Default: ahora.' })
  @IsOptional()
  @IsDateString()
  assignmentDate?: string;

  @ApiPropertyOptional({ description: 'Observaciones adicionales' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'ID del StorageObject previamente subido (dominio PAYROLL)' })
  @IsOptional()
  @IsString()
  storageObjectId?: string;
}
