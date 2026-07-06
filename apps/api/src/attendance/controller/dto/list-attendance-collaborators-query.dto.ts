import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeContractType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ATTENDANCE_COLLABORATORS_PAGE_SIZES } from '../../attendance-collaborators.constants';

export class ListAttendanceCollaboratorsQueryDto {
  @ApiPropertyOptional({
    description: 'Nombre, apellidos, documento o email (case+accent insensitive)',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'ID de EmployeePosition (Especialidad/Cargo)' })
  @IsString()
  @IsOptional()
  positionId?: string;

  @ApiPropertyOptional({ enum: EmployeeContractType })
  @IsEnum(EmployeeContractType)
  @IsOptional()
  contractType?: EmployeeContractType;

  @ApiPropertyOptional({
    description: 'Área operativa (texto libre, igual a EmployeeDetails.area)',
  })
  @IsString()
  @IsOptional()
  area?: string;

  @ApiPropertyOptional({ description: 'ID de sede' })
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional({
    description: 'userId de un SUPERVISOR/MANAGER — filtra por sus sedes asignadas',
  })
  @IsString()
  @IsOptional()
  supervisorUserId?: string;

  @ApiPropertyOptional({ enum: ['administrativo', 'operaciones'] })
  @IsIn(['administrativo', 'operaciones'])
  @IsOptional()
  laborClassification?: 'administrativo' | 'operaciones';

  @ApiPropertyOptional({ enum: ['all', 'active', 'inactive'], default: 'all' })
  @IsIn(['all', 'active', 'inactive'])
  @IsOptional()
  status?: 'all' | 'active' | 'inactive';

  @ApiPropertyOptional({ enum: ['employee', 'role', 'hireDate'] })
  @IsIn(['employee', 'role', 'hireDate'])
  @IsOptional()
  sortBy?: 'employee' | 'role' | 'hireDate';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortDir?: 'asc' | 'desc';

  @ApiPropertyOptional({ default: 1 })
  @Transform(({ value }) => (value != null ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ enum: ATTENDANCE_COLLABORATORS_PAGE_SIZES, default: 20 })
  @Transform(({ value }) => (value != null ? Number(value) : undefined))
  @IsIn(ATTENDANCE_COLLABORATORS_PAGE_SIZES)
  @IsOptional()
  pageSize?: number;
}
