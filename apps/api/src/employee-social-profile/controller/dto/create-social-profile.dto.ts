import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BeneficiaryDisabilityType, DocumentType, EmployeeRelationshipType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxDate,
} from 'class-validator';

export class CreateSocialProfileDto {
  @ApiPropertyOptional({ enum: DocumentType })
  @IsEnum(DocumentType)
  @IsOptional()
  documentType?: DocumentType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @ApiProperty({ description: 'Primer nombre del familiar' })
  @IsString()
  @IsNotEmpty()
  primerNombre!: string;

  @ApiPropertyOptional({ description: 'Segundo nombre del familiar' })
  @IsString()
  @IsOptional()
  segundoNombre?: string;

  @ApiProperty({ description: 'Primer apellido del familiar' })
  @IsString()
  @IsNotEmpty()
  primerApellido!: string;

  @ApiPropertyOptional({ description: 'Segundo apellido del familiar' })
  @IsString()
  @IsOptional()
  segundoApellido?: string;

  @ApiProperty({ enum: EmployeeRelationshipType })
  @IsEnum(EmployeeRelationshipType)
  @IsNotEmpty()
  relationshipType!: EmployeeRelationshipType;

  @ApiProperty({ enum: BeneficiaryDisabilityType })
  @IsEnum(BeneficiaryDisabilityType)
  @IsNotEmpty()
  disability!: BeneficiaryDisabilityType;

  @ApiProperty({ description: 'Fecha de nacimiento (no puede ser futura)' })
  @Type(() => Date)
  @IsDate()
  @MaxDate(new Date(), { message: 'La fecha de nacimiento no puede ser futura' })
  birthDate!: Date;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isDependent?: boolean;
}
