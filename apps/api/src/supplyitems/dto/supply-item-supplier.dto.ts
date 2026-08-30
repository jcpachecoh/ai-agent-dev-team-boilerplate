import { ApiProperty } from '@nestjs/swagger';
import { StockUnit } from '@prisma/client';

export class SupplyItemSupplierDto {
  @ApiProperty()
  supplierId!: string;

  @ApiProperty()
  razonSocial!: string;

  @ApiProperty()
  nit!: string;

  @ApiProperty()
  precioUnitario!: number;

  @ApiProperty({ enum: StockUnit })
  unidadCompra!: StockUnit;

  @ApiProperty()
  factorConversion!: number;

  @ApiProperty()
  tiempoEntregaDias!: number;

  @ApiProperty()
  esProveedorPrincipal!: boolean;
}
