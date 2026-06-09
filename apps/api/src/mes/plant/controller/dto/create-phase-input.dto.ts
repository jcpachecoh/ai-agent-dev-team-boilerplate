import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockUnit } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePhaseInputDto {
  @ApiProperty({ example: 'supply-item-uuid' })
  @IsString()
  @IsNotEmpty()
  supplyItemId!: string;

  @ApiProperty({
    description: 'Quantity per recipe batch (decimal string, up to 3 fractional digits)',
    example: '2.500',
  })
  @IsNumberString()
  quantityPerBatch!: string;

  @ApiProperty({ enum: StockUnit, example: StockUnit.KILOGRAMS })
  @IsEnum(StockUnit)
  unit!: StockUnit;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isOptional?: boolean;
}
