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

  @ApiProperty({ description: 'Current warehouse stock quantity' })
  stockActualBodega!: number;

  @ApiProperty()
  aplicaVencimiento!: boolean;

  @ApiProperty()
  aplicaLote!: boolean;

  @ApiPropertyOptional({ nullable: true })
  fechaVencimiento?: string | null;

  @ApiPropertyOptional({ nullable: true })
  lote?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Location (sede/planta) id' })
  locationId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Location display name (sede o planta)',
  })
  ubicacion?: string | null;
  @ApiPropertyOptional({ nullable: true })
  subcategoria?: string | null;

  @ApiPropertyOptional({ nullable: true })
  genero?: string | null;

  @ApiPropertyOptional({ nullable: true })
  talla?: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiPropertyOptional({ type: ProveedorPrincipalDto })
  proveedorPrincipal?: ProveedorPrincipalDto | null;

  @ApiPropertyOptional({
    description: 'Alias of stockActualBodega for legacy clients',
    nullable: true,
  })
  stockDisponible!: number | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
