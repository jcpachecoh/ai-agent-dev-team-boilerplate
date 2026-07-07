import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetStatus, AssetType } from '@prisma/client';

export class EmployeeAssetResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  employeeId!: string;

  @ApiProperty()
  assetName!: string;

  @ApiProperty({ enum: AssetType })
  type!: AssetType;

  @ApiProperty()
  assignmentDate!: Date;

  @ApiProperty({ description: 'Valor en COP' })
  value!: number;

  @ApiProperty({ enum: AssetStatus })
  status!: AssetStatus;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiPropertyOptional()
  storageObjectId?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
