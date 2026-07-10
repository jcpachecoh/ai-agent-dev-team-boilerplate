import { CesantiasInterestStatus, CesantiasSettlementStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

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
