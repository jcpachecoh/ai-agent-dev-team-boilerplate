import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockUnit } from '@prisma/client';

export class SupplyCategoryBriefDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nombre!: string;
}

export class ProveedorPrincipalDto {
  @ApiProperty()
  supplierId!: string;

  @ApiProperty()
  razonSocial!: string;
}

export class SupplyItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  nombre!: string;

  @ApiProperty()
  codigoInterno!: string;

  @ApiProperty()
  categoriaId!: string;

  @ApiPropertyOptional({ type: SupplyCategoryBriefDto })
  categoria?: SupplyCategoryBriefDto;

  @ApiPropertyOptional()
  descripcion?: string | null;

  @ApiProperty({ enum: StockUnit })
  unidadBase!: StockUnit;

  @ApiProperty()
  factorConversion!: number;

  @ApiProperty()
  costoPromedioPonderado!: number;

  @ApiProperty()
  stockMinimoBodega!: number;

  @ApiProperty()
  stockMaximoBodega!: number;

  @ApiProperty()
  aplicaVencimiento!: boolean;

  @ApiProperty()
  aplicaLote!: boolean;

  @ApiProperty()
  isActive!: boolean;

  @ApiPropertyOptional({ type: ProveedorPrincipalDto })
  proveedorPrincipal?: ProveedorPrincipalDto | null;

  @ApiPropertyOptional({
    description: 'Placeholder until warehouse stock is integrated',
    nullable: true,
  })
  stockDisponible!: number | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
