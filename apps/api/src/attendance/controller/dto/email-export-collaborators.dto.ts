import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { ATTENDANCE_COLLABORATORS_EXPORT_MAX_RECIPIENTS } from '../../attendance-collaborators.constants';
import { ExportFiltersDto } from './export-collaborators-query.dto';

export class EmailExportCollaboratorsDto {
  @ApiProperty({ type: [String], description: 'Máximo 10 destinatarios, emails válidos' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(ATTENDANCE_COLLABORATORS_EXPORT_MAX_RECIPIENTS)
  @ArrayUnique()
  @IsEmail({}, { each: true })
  recipients!: string[];

  @ApiProperty({ enum: ['excel', 'pdf'] })
  @IsIn(['excel', 'pdf'])
  format!: 'excel' | 'pdf';

  @ApiProperty({ type: ExportFiltersDto })
  @ValidateNested()
  @Type(() => ExportFiltersDto)
  filters!: ExportFiltersDto;
}
