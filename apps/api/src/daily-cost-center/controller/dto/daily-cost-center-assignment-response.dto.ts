import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentSource } from '@prisma/client';

export class EmployeeCalendarDayResponseDto {
  @ApiProperty({ example: '2026-07-01' })
  date!: string;

  @ApiPropertyOptional({ nullable: true })
  locationId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  locationName!: string | null;

  @ApiPropertyOptional({ enum: AssignmentSource, nullable: true })
  source!: AssignmentSource | null;

  @ApiProperty()
  isPending!: boolean;
}

export class PendingAssignmentResponseDto {
  @ApiProperty()
  employeeId!: string;

  @ApiProperty()
  employeeName!: string;

  @ApiProperty({ example: '2026-07-01' })
  date!: string;

  @ApiPropertyOptional({ nullable: true })
  suggestedLocationId!: string | null;
}

export class ManualAssignmentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  employeeId!: string;

  @ApiProperty({ example: '2026-07-01' })
  date!: string;

  @ApiProperty()
  locationId!: string;

  @ApiPropertyOptional({ nullable: true })
  shiftId!: string | null;

  @ApiProperty({ enum: AssignmentSource })
  source!: AssignmentSource;
}
