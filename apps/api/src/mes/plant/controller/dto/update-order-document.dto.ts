import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductionQualityCheckType, StockUnit } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';

export class UpdateOrderDocumentMaterialDto {
  @ApiPropertyOptional({ example: 'material-uuid' })
  @IsString()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  lotNumber?: string | null;

  @ApiPropertyOptional({ example: '24.000', nullable: true })
  @IsOptional()
  @IsString()
  consumedQuantity?: string | null;
}

export class UpdateOrderDocumentByproductDto {
  @ApiPropertyOptional({ example: 'byproduct-uuid' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ example: 'Cáscara de papa' })
  @IsString()
  itemName!: string;

  @ApiPropertyOptional({ enum: StockUnit })
  @IsEnum(StockUnit)
  unit!: StockUnit;

  @ApiPropertyOptional({ example: '5.000', nullable: true })
  @IsOptional()
  @IsString()
  actualQuantity?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  lotNumber?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  expirationDate?: string | null;

  @ApiPropertyOptional({ description: 'Delete existing byproduct when id is set' })
  @IsOptional()
  @IsBoolean()
  _delete?: boolean;
}

export class UpdateOrderDocumentQualityCheckDto {
  @ApiPropertyOptional({ enum: ProductionQualityCheckType })
  @IsEnum(ProductionQualityCheckType)
  checkType!: ProductionQualityCheckType;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  temperature?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  color?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  smell?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  texture?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class UpdateOrderDocumentDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  lotNumber?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  productionDate?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  deliveryDate?: string | null;

  @ApiPropertyOptional({ example: '249.200', nullable: true })
  @IsOptional()
  @IsString()
  batchWeight?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({ type: [UpdateOrderDocumentMaterialDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderDocumentMaterialDto)
  materials?: UpdateOrderDocumentMaterialDto[];

  @ApiPropertyOptional({ type: [UpdateOrderDocumentByproductDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderDocumentByproductDto)
  byproducts?: UpdateOrderDocumentByproductDto[];

  @ApiPropertyOptional({ type: [UpdateOrderDocumentQualityCheckDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderDocumentQualityCheckDto)
  qualityChecks?: UpdateOrderDocumentQualityCheckDto[];
}
