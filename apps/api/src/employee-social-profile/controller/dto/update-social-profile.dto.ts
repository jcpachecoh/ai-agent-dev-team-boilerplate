import { ApiPropertyOptional } from '@nestjs/swagger';
import { BeneficiaryDisabilityType, DocumentType, EmployeeRelationshipType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsOptional, IsString, MaxDate } from 'class-validator';

export class UpdateSocialProfileDto {
  @ApiPropertyOptional({ enum: DocumentType })
  @IsEnum(DocumentType)
  @IsOptional()
  documentType?: DocumentType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  primerNombre?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  segundoNombre?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  primerApellido?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  segundoApellido?: string;

  @ApiPropertyOptional({ enum: EmployeeRelationshipType })
  @IsEnum(EmployeeRelationshipType)
  @IsOptional()
  relationshipType?: EmployeeRelationshipType;

  @ApiPropertyOptional({ enum: BeneficiaryDisabilityType })
  @IsEnum(BeneficiaryDisabilityType)
  @IsOptional()
  disability?: BeneficiaryDisabilityType;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @MaxDate(new Date(), { message: 'La fecha de nacimiento no puede ser futura' })
  @IsOptional()
  birthDate?: Date;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDependent?: boolean;
}
