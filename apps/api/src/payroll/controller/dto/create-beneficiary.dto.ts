import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BeneficiaryDisabilityType, DocumentType, EmployeeRelationshipType } from '@prisma/client';

const ALLOWED_TYPES = [
  EmployeeRelationshipType.FATHER,
  EmployeeRelationshipType.MOTHER,
  EmployeeRelationshipType.SPOUSE,
  EmployeeRelationshipType.CHILD,
  EmployeeRelationshipType.MINOR_IN_CHARGE,
  EmployeeRelationshipType.ORPHAN_SIBLING,
] as const;

export type BeneficiaryRelationshipType = (typeof ALLOWED_TYPES)[number];

export class CreateBeneficiaryDto {
  @ApiPropertyOptional({ enum: DocumentType })
  @IsEnum(DocumentType)
  @IsOptional()
  documentType?: DocumentType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  primerNombre!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  segundoNombre?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  primerApellido!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  segundoApellido?: string;

  @ApiProperty({ enum: ALLOWED_TYPES })
  @IsEnum(ALLOWED_TYPES)
  relationshipType!: BeneficiaryRelationshipType;

  @ApiProperty({ enum: BeneficiaryDisabilityType })
  @IsEnum(BeneficiaryDisabilityType)
  @IsNotEmpty()
  disability!: BeneficiaryDisabilityType;

  @ApiProperty({ description: 'Fecha de nacimiento (no puede ser futura)' })
  @IsDateString()
  @IsNotEmpty()
  fechaNacimiento!: string;
}
