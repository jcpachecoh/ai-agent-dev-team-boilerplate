import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentFileType } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEmployeeDocumentDto {
  @ApiProperty({ description: 'ID del empleado (EmployeeDetails.id)' })
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @ApiProperty({ enum: DocumentFileType, description: 'Tipo de documento' })
  @IsEnum(DocumentFileType)
  fileType!: DocumentFileType;

  @ApiProperty({
    description: 'Título o descripción del documento',
    example: 'Cédula de ciudadanía',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'ID del StorageObject previamente subido (dominio PAYROLL)' })
  @IsString()
  @IsNotEmpty()
  storageObjectId!: string;

  @ApiPropertyOptional({ description: 'Fecha de expedición (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({ description: 'Fecha de vencimiento (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Observaciones adicionales' })
  @IsOptional()
  @IsString()
  notes?: string;
}
