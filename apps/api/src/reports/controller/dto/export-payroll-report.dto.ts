import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PeriodQueryDto } from './report-query.dto';

export enum ExportFormat {
  PDF = 'PDF',
  XLSX = 'XLSX',
}

export class ExportPayrollReportDto extends PeriodQueryDto {
  @ApiProperty({
    enum: ExportFormat,
    description: 'Export format: PDF (binary) or XLSX (Excel workbook).',
  })
  @IsEnum(ExportFormat, { message: 'format must be PDF or XLSX' })
  format!: ExportFormat;
}
