import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TurnoAssignmentType, TurnoJornada } from '@prisma/client';

export class AssignmentTurnoSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() nombre!: string;
  @ApiProperty() sigla!: string;
  @ApiProperty() horaInicio!: string;
  @ApiProperty() horaFin!: string;
  @ApiProperty({ enum: TurnoJornada }) jornada!: TurnoJornada;
}

export class WeeklyAssignmentCellDto {
  @ApiProperty() fecha!: string;
  @ApiPropertyOptional() assignmentId?: string;
  @ApiProperty({ enum: ['ASSIGNED', 'REST', 'BASE'] }) type!: 'ASSIGNED' | 'REST' | 'BASE';
  @ApiPropertyOptional({ type: AssignmentTurnoSummaryDto, nullable: true })
  turno!: AssignmentTurnoSummaryDto | null;
  @ApiProperty() esDescanso!: boolean;
  @ApiProperty() turnoBase!: boolean;
}

export class WeeklyColaboradorDto {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() nombre!: string;
  @ApiProperty() documento!: string;
  @ApiProperty() locationId!: string;
  @ApiProperty({ type: [WeeklyAssignmentCellDto] }) turnos!: WeeklyAssignmentCellDto[];
}

export class WeeklyAssignmentsPaginationDto {
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
}

export class WeeklyAssignmentsResponseDto {
  @ApiProperty() weekStart!: string;
  @ApiProperty({ type: [String] }) dates!: string[];
  @ApiProperty({ type: [WeeklyColaboradorDto] }) colaboradores!: WeeklyColaboradorDto[];
  @ApiProperty({ type: WeeklyAssignmentsPaginationDto })
  pagination!: WeeklyAssignmentsPaginationDto;
}

export class TurnoAssignmentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() employeeId!: string;
  @ApiProperty() workDate!: string;
  @ApiProperty({ enum: TurnoAssignmentType }) type!: TurnoAssignmentType;
  @ApiPropertyOptional({ type: AssignmentTurnoSummaryDto, nullable: true })
  turno!: AssignmentTurnoSummaryDto | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
