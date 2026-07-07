import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BeneficiaryDisabilityType,
  DocumentType,
  EmployeeRelationshipType,
  EmployeeSocialProfile,
} from '@prisma/client';

import { calculateAge } from '../../../common/utils/date.util';

export class SocialProfileResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() employeeDetailsId!: string;
  @ApiProperty() fullName!: string;
  @ApiPropertyOptional() primerNombre?: string | null;
  @ApiPropertyOptional() segundoNombre?: string | null;
  @ApiPropertyOptional() primerApellido?: string | null;
  @ApiPropertyOptional() segundoApellido?: string | null;
  @ApiPropertyOptional({ enum: DocumentType }) documentType?: DocumentType | null;
  @ApiPropertyOptional() documentNumber?: string | null;
  @ApiProperty({ enum: EmployeeRelationshipType }) relationshipType!: EmployeeRelationshipType;
  @ApiProperty({ enum: BeneficiaryDisabilityType }) disability!: BeneficiaryDisabilityType;
  @ApiProperty() birthDate!: Date;
  @ApiProperty() age!: number;
  @ApiProperty() isDependent!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiPropertyOptional() deletedAt?: Date | null;
}

export function toSocialProfileResponse(profile: EmployeeSocialProfile): SocialProfileResponseDto {
  return {
    id: profile.id,
    tenantId: profile.tenantId,
    employeeDetailsId: profile.employeeDetailsId,
    fullName: profile.fullName,
    primerNombre: profile.primerNombre,
    segundoNombre: profile.segundoNombre,
    primerApellido: profile.primerApellido,
    segundoApellido: profile.segundoApellido,
    documentType: profile.documentType,
    documentNumber: profile.documentNumber,
    relationshipType: profile.relationshipType,
    disability: profile.disability,
    birthDate: profile.birthDate,
    age: calculateAge(profile.birthDate),
    isDependent: profile.isDependent,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    deletedAt: profile.deletedAt,
  };
}
