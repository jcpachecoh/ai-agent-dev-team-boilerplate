import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PriceHistoryEntryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  costoAnterior!: number;

  @ApiProperty()
  costoNuevo!: number;

  @ApiPropertyOptional()
  cantidadRecibida?: number | null;

  @ApiPropertyOptional()
  stockAnterior?: number | null;

  @ApiPropertyOptional()
  stockNuevo?: number | null;

  @ApiPropertyOptional()
  motivo?: string | null;

  @ApiPropertyOptional()
  referenciaTipo?: string | null;

  @ApiPropertyOptional()
  referenciaId?: string | null;

  @ApiProperty()
  createdAt!: string;
}
