import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ListAttendanceCollaboratorsQueryDto } from './list-attendance-collaborators-query.dto';

/** Mismos filtros que el listado, sin sort/paginación — el export siempre trae el dataset filtrado completo. */
export class ExportFiltersDto extends OmitType(ListAttendanceCollaboratorsQueryDto, [
  'sortBy',
  'sortDir',
  'page',
  'pageSize',
] as const) {}

export class ExportCollaboratorsQueryDto extends ExportFiltersDto {
  @ApiPropertyOptional({ enum: ['excel', 'pdf'] })
  @IsIn(['excel', 'pdf'])
  format!: 'excel' | 'pdf';
}
