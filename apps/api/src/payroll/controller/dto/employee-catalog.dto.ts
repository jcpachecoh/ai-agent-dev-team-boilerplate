import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeCatalogType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ListEmployeeCatalogQueryDto {
  @ApiPropertyOptional({ enum: EmployeeCatalogType })
  @IsEnum(EmployeeCatalogType)
  @IsOptional()
  type?: EmployeeCatalogType;

  /** When true, includes inactive options (admin). Default: active-only (request forms). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }): boolean => value === 'true' || value === true)
  includeInactive?: boolean;
}

export class CreateEmployeeCatalogOptionDto {
  @ApiProperty({ enum: EmployeeCatalogType })
  @IsEnum(EmployeeCatalogType)
  type!: EmployeeCatalogType;

  @ApiProperty({ example: 'Inventario físico semana' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }): string =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : String(value ?? ''),
  )
  name!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Código PILA oficial. Null para OVERTIME_REASON / AREA / DEPARTMENT.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  pilaCode?: string | null;
}

export class UpdateEmployeeCatalogOptionDto {
  @ApiPropertyOptional({ example: 'Aseo nocturno' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }): string =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : String(value ?? ''),
  )
  name?: string;

  @ApiPropertyOptional({ description: 'Activar o desactivar (soft). No elimina la fila.' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Código PILA. Ignorado / forzado null para OVERTIME_REASON.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  pilaCode?: string | null;
}

export class EmployeeCatalogOptionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: EmployeeCatalogType })
  type!: EmployeeCatalogType;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Código oficial PILA (UGPP). Null si no aplica o no verificado.',
  })
  pilaCode!: string | null;

  @ApiProperty({ description: 'false = desactivado (conserva historial / FKs).' })
  isActive!: boolean;
}
