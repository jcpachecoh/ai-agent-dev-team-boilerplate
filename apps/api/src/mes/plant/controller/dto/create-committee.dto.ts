import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductionCommitteeStatus } from '@prisma/client';
import { ArrayMinSize, IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateCommitteeDto {
  @ApiProperty({
    type: [String],
    example: ['user-uuid-1', 'user-uuid-2'],
    description: 'Global User IDs with role OPERATIONS_ADMIN',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  memberUserIds!: string[];

  @ApiPropertyOptional({
    enum: [ProductionCommitteeStatus.DRAFT, ProductionCommitteeStatus.ACTIVE],
    default: ProductionCommitteeStatus.DRAFT,
  })
  @IsEnum(ProductionCommitteeStatus)
  @IsOptional()
  status?: ProductionCommitteeStatus;
}
