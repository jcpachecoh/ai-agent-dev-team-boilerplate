import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductionCommitteeStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class ListCommitteesQueryDto {
  @ApiPropertyOptional({ enum: ProductionCommitteeStatus })
  @IsEnum(ProductionCommitteeStatus)
  @IsOptional()
  status?: ProductionCommitteeStatus;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 50, minimum: 1, default: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;
}
