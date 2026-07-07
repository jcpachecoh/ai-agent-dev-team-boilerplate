import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PeriodQueryDto } from './report-query.dto';
import { ExportFormat } from './export-format.enum';

export { ExportFormat };

export class ExportPayrollReportDto extends PeriodQueryDto {
  @ApiProperty({
    enum: ExportFormat,
    description: 'Export format: PDF (binary) or XLSX (Excel workbook).',
  })
  @IsEnum(ExportFormat, { message: 'format must be PDF or XLSX' })
  format!: ExportFormat;
}
