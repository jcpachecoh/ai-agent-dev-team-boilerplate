import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkImportRowErrorDto {
  @ApiProperty() row!: number;
  @ApiPropertyOptional() employee?: string;
  @ApiPropertyOptional() date?: string;
  @ApiProperty() reason!: string;
}

export class BulkImportResultDto {
  @ApiProperty() totalRows!: number;
  @ApiProperty() totalAssignments!: number;
  @ApiProperty() createdOrUpdated!: number;
  @ApiProperty() returnedToBase!: number;
  @ApiProperty() restDays!: number;
  @ApiProperty() excluded!: number;
  @ApiProperty() errorCount!: number;
  @ApiProperty({ type: [BulkImportRowErrorDto] }) errors!: BulkImportRowErrorDto[];
}
