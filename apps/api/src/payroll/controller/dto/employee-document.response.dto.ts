import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentFileType } from '@prisma/client';

export class EmployeeDocumentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() employeeId!: string;
  @ApiProperty({ enum: DocumentFileType }) fileType!: DocumentFileType;
  @ApiProperty() title!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) issueDate!: Date | null;
  @ApiPropertyOptional({ type: String, nullable: true }) expiryDate!: Date | null;
  @ApiProperty() storageObjectId!: string;
  @ApiProperty() mimeType!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) notes!: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
