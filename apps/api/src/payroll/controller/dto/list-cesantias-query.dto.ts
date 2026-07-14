import {
  CesantiasFundChannel,
  CesantiasInterestStatus,
  CesantiasSettlementStatus,
} from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

function toOptionalNumber(value: unknown): number | undefined {
  return value !== null && value !== undefined ? Number(value) : undefined;
}

export class ListCesantiasQueryDto {
  @Transform(({ value }): number | undefined => toOptionalNumber(value))
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  year?: number;

  @IsEnum(CesantiasSettlementStatus)
  @IsOptional()
  cesantiasStatus?: CesantiasSettlementStatus;

  @IsEnum(CesantiasInterestStatus)
  @IsOptional()
  interestStatus?: CesantiasInterestStatus;

  /** OS-588 (fase 4) — filtro "canal" pedido por el frontend (FNA vs fondo privado). */
  @IsEnum(CesantiasFundChannel)
  @IsOptional()
  fundChannelSnapshot?: CesantiasFundChannel;

  /** OS-588 (fase 4) — filtro "fondo" pedido por el frontend, coincidencia exacta contra
   * el snapshot persistido (no el catálogo actual del empleado). */
  @IsString()
  @IsOptional()
  fundNameSnapshot?: string;

  @Transform(({ value }): number | undefined => toOptionalNumber(value))
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @Transform(({ value }): number | undefined => toOptionalNumber(value))
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number;
}
