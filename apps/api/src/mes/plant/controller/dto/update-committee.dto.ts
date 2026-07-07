import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductionCommitteeStatus } from '@prisma/client';
import { ArrayMinSize, IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateCommitteeDto {
  @ApiPropertyOptional({ enum: ProductionCommitteeStatus })
  @IsEnum(ProductionCommitteeStatus)
  @IsOptional()
  status?: ProductionCommitteeStatus;

  @ApiPropertyOptional({
    type: [String],
    description: 'Replaces all committee members when provided',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsOptional()
  memberUserIds?: string[];
}
