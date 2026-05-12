import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumberString, Matches } from 'class-validator';
import { StockUnit } from '@prisma/client';

export class AddRecipeItemDto {
  @IsString()
  @IsNotEmpty()
  supplyItemId!: string;

  @IsNotEmpty()
  @IsNumberString()
  @Matches(/^(?!0(\.0+)?$)[0-9]+(\.[0-9]+)?$/, {
    message: 'cantidad must be a numeric string greater than 0 (e.g., "1", "2.5", "0.25")',
  })
  cantidad!: string;

  @IsEnum(StockUnit)
  unidad!: StockUnit;

  @IsString()
  @IsOptional()
  notas?: string;
}
