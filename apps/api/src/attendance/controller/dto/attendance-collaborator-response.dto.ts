import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeContractType, LaborClassification } from '@prisma/client';
import { AssignmentTurnoSummaryDto } from '../../../turnos/controller/dto/turno-assignment-response.dto';

export class AttendanceCollaboratorSupervisorDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) email!: string | null;
}

export class AttendanceCollaboratorTodayShiftDto {
  @ApiProperty({ enum: ['ASSIGNED', 'REST', 'BASE'] }) type!: 'ASSIGNED' | 'REST' | 'BASE';
  @ApiPropertyOptional({ type: AssignmentTurnoSummaryDto, nullable: true })
  turno!: AssignmentTurnoSummaryDto | null;
}

export class AttendanceCollaboratorItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() locationId!: string;
  @ApiPropertyOptional({ nullable: true }) locationName!: string | null;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) primerApellido!: string | null;
  @ApiPropertyOptional({ nullable: true }) segundoApellido!: string | null;
  @ApiProperty() cedula!: string;
  @ApiProperty() email!: string;
  @ApiPropertyOptional({ nullable: true }) positionId!: string | null;
  @ApiProperty() positionName!: string;
  @ApiProperty() area!: string;
  @ApiProperty({ enum: EmployeeContractType }) contractType!: EmployeeContractType;
  @ApiProperty({ enum: LaborClassification }) laborClassification!: LaborClassification;
  @ApiProperty() isActive!: boolean;
  @ApiProperty({ type: [AttendanceCollaboratorSupervisorDto] })
  supervisors!: AttendanceCollaboratorSupervisorDto[];
  @ApiProperty({ type: AttendanceCollaboratorTodayShiftDto })
  todayShift!: AttendanceCollaboratorTodayShiftDto;
  @ApiProperty({ description: 'Portal trabajador — flag administrativo (OWNER/SUPER_ADMIN)' })
  portalWorkerEnabled!: boolean;
}

export class AttendanceCollaboratorsPaginationDto {
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}

export class AttendanceCollaboratorsSummaryDto {
  @ApiProperty() total!: number;
  @ApiProperty() active!: number;
  @ApiProperty() inactive!: number;
}

export class AttendanceCollaboratorsResponseDto {
  @ApiProperty({ type: [AttendanceCollaboratorItemDto] })
  items!: AttendanceCollaboratorItemDto[];
  @ApiProperty({ type: AttendanceCollaboratorsPaginationDto })
  pagination!: AttendanceCollaboratorsPaginationDto;
  @ApiProperty({ type: AttendanceCollaboratorsSummaryDto })
  summary!: AttendanceCollaboratorsSummaryDto;
}

export class AttendanceCollaboratorSupervisorOptionDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) email!: string | null;
}
