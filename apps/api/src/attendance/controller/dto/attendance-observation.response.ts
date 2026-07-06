import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { AttendanceObservation } from '@prisma/client';

class ObservationActorDto {
  @ApiProperty() email!: string;
}

export class AttendanceObservationResponseDto implements AttendanceObservation {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() employeeId!: string;
  @ApiProperty() workDate!: Date;
  @ApiProperty() note!: string;
  @ApiPropertyOptional({ nullable: true }) createdByUserId!: string | null;
  @ApiPropertyOptional({ nullable: true }) updatedByUserId!: string | null;
  @ApiPropertyOptional({ type: ObservationActorDto, nullable: true })
  createdBy?: ObservationActorDto | null;
  @ApiPropertyOptional({ type: ObservationActorDto, nullable: true })
  updatedBy?: ObservationActorDto | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
