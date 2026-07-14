import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

function toNumber(value: unknown): number {
  return Number(value);
}

export class ExportAvailabilityQueryDto {
  @Transform(({ value }): number => toNumber(value))
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;
}
