import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeDetails, User } from '@prisma/client';

export class EmployeeResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() locationId!: string;
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
  @ApiProperty() isActive!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiPropertyOptional() deletedAt?: Date | null;
  @ApiPropertyOptional() user?: {
    email: string;
    cedula: string;
    documentType: string;
  };
  @ApiPropertyOptional() location?: {
    id: string;
    name: string;
  };
}

export function toEmployeeResponse(
  employee: EmployeeDetails & {
    user?: User | null;
    location?: { id: string; name: string } | null;
  },
): EmployeeResponseDto {
  return {
    id: employee.id,
    userId: employee.userId,
    tenantId: employee.tenantId,
    name: employee.name,
    locationId: employee.locationId,
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
    isActive: employee.isActive,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
    deletedAt: employee.deletedAt,
    user: employee.user
      ? {
          email: employee.user.email,
          cedula: employee.user.cedula,
          documentType: employee.user.documentType,
        }
      : undefined,
    location: employee.location
      ? {
          id: employee.location.id,
          name: employee.location.name,
        }
      : undefined,
  };
}
