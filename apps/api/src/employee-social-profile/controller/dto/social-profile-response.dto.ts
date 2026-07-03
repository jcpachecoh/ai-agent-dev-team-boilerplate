import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeRelationshipType, EmployeeSocialProfile } from '@prisma/client';

export class SocialProfileResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() employeeDetailsId!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty({ enum: EmployeeRelationshipType }) relationshipType!: EmployeeRelationshipType;
  @ApiProperty() birthDate!: Date;
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
    relationshipType: profile.relationshipType,
    birthDate: profile.birthDate,
    isDependent: profile.isDependent,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    deletedAt: profile.deletedAt,
  };
}
