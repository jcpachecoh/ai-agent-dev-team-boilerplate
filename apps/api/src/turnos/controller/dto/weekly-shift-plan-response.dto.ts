import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WeeklyShiftPlanStatus } from '@prisma/client';

export class WeeklyShiftPlanResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  locationId!: string;

  @ApiProperty({ description: 'Lunes de la semana (YYYY-MM-DD)' })
  weekStart!: string;

  @ApiProperty({ enum: WeeklyShiftPlanStatus })
  status!: WeeklyShiftPlanStatus;

  @ApiPropertyOptional({ nullable: true })
  submittedByUserId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  submittedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  approvedByUserId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  approvedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  rejectedByUserId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  rejectedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  rejectionReason!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
