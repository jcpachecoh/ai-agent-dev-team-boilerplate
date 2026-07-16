import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeDetails, StorageObject, EmployeeSocialProfile, User } from '@prisma/client';

import { calculateAge } from '../../common/utils/date.util';

const PUBLIC_DOMAIN = (): string => {
  const raw = process.env.R2_PUBLIC_DOMAIN ?? '';
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`;
};

export class EmployeeResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({
    nullable: true,
    description: 'null cuando costCenter = ROTANTE (CONN-06) — sin sede fija',
  })
  locationId!: string | null;
  @ApiPropertyOptional() positionId?: string | null;
  @ApiPropertyOptional() position?: string | null;
  @ApiPropertyOptional() area?: string | null;
  @ApiPropertyOptional() department?: string | null;
  @ApiPropertyOptional() contractType?: string | null;
  @ApiPropertyOptional() hireDate?: Date | null;
  @ApiPropertyOptional() contractStart?: Date | null;
  @ApiPropertyOptional() contractEnd?: Date | null;
  @ApiPropertyOptional() salaryType?: string | null;
  @ApiProperty() salaryAmount!: string;
  @ApiProperty() hasTransportSubsidy!: boolean;
  @ApiProperty() isExemptFromTax!: boolean;
  @ApiPropertyOptional() epsName?: string | null;
  @ApiPropertyOptional() pensionFundName?: string | null;
  @ApiPropertyOptional() cesantiasFundName?: string | null;
  @ApiPropertyOptional() arlName?: string | null;
  @ApiPropertyOptional() arlRiskLevel?: string | null;
  @ApiPropertyOptional() cajaCompensacion?: string | null;
  @ApiPropertyOptional() photoStorageObjectId?: string | null;
  @ApiPropertyOptional() photoUrl?: string | null;
  @ApiPropertyOptional() barrio?: string | null;
  @ApiPropertyOptional() localidad?: string | null;
  @ApiPropertyOptional() costCenter?: string | null;
  @ApiPropertyOptional() laborClassification?: string | null;
  @ApiPropertyOptional() nonSalaryAmount?: string | null;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiPropertyOptional() deletedAt?: Date | null;
  @ApiPropertyOptional() user?: {
    email: string;
    cedula: string;
    documentType: string;
    roleId: string;
  };
  @ApiPropertyOptional() location?: {
    id: string;
    name: string;
  };
  @ApiPropertyOptional() beneficiaries?: Array<{
    id: string;
    fullName: string;
    primerNombre: string | null;
    segundoNombre: string | null;
    primerApellido: string | null;
    segundoApellido: string | null;
    documentType: string | null;
    documentNumber: string | null;
    relationshipType: string;
    disability: string;
    birthDate: Date;
    age: number;
  }>;
}

export function toEmployeeResponse(
  employee: EmployeeDetails & {
    user?: User | null;
    location?: { id: string; name: string } | null;
    photoStorageObject?: StorageObject | null;
    socialProfiles?: EmployeeSocialProfile[];
  },
): EmployeeResponseDto {
  const photoUrl = employee.photoStorageObject?.key
    ? `${PUBLIC_DOMAIN()}/${employee.photoStorageObject.key}`
    : null;

  return {
    id: employee.id,
    userId: employee.userId,
    tenantId: employee.tenantId,
    name: employee.name,
    locationId: employee.locationId,
    positionId: employee.positionId ?? undefined,
    position: employee.position ?? undefined,
    area: employee.area ?? undefined,
    department: employee.department ?? undefined,
    contractType: employee.contractType ?? undefined,
    hireDate: employee.hireDate ?? undefined,
    contractStart: employee.contractStart ?? undefined,
    contractEnd: employee.contractEnd ?? undefined,
    salaryType: employee.salaryType ?? undefined,
    salaryAmount: (employee.salaryAmount ?? 0).toString(),
    hasTransportSubsidy: employee.hasTransportSubsidy,
    isExemptFromTax: employee.isExemptFromTax,
    epsName: employee.epsName ?? undefined,
    pensionFundName: employee.pensionFundName ?? undefined,
    cesantiasFundName: employee.cesantiasFundName ?? undefined,
    arlName: employee.arlName ?? undefined,
    arlRiskLevel: employee.arlRiskLevel ?? undefined,
    cajaCompensacion: employee.cajaCompensacion ?? undefined,
    photoStorageObjectId: employee.photoStorageObjectId ?? null,
    photoUrl: photoUrl ?? null,
    barrio: employee.barrio ?? undefined,
    localidad: employee.localidad ?? undefined,
    costCenter: employee.costCenter ?? undefined,
    laborClassification: employee.laborClassification ?? undefined,
    nonSalaryAmount:
      employee.nonSalaryAmount != null ? employee.nonSalaryAmount.toString() : undefined,
    isActive: employee.isActive,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
    deletedAt: employee.deletedAt,
    user: employee.user
      ? {
          email: employee.user.email,
          cedula: employee.user.cedula,
          documentType: employee.user.documentType,
          roleId: employee.user.roleId,
        }
      : undefined,
    location: employee.location
      ? {
          id: employee.location.id,
          name: employee.location.name,
        }
      : undefined,
    beneficiaries: employee.socialProfiles?.map((p) => ({
      id: p.id,
      fullName: p.fullName,
      primerNombre: p.primerNombre,
      segundoNombre: p.segundoNombre,
      primerApellido: p.primerApellido,
      segundoApellido: p.segundoApellido,
      documentType: p.documentType,
      documentNumber: p.documentNumber,
      relationshipType: p.relationshipType,
      disability: p.disability,
      birthDate: p.birthDate,
      age: calculateAge(p.birthDate),
    })),
  };
}
