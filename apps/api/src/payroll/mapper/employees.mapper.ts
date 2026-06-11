import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeDetails, User } from '@prisma/client';

export class EmployeeResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() locationId!: string;
  @ApiProperty() position!: string;
  @ApiProperty() area!: string;
  @ApiProperty() department!: string;
  @ApiProperty() contractType!: string;
  @ApiProperty() hireDate!: Date;
  @ApiProperty() contractStart!: Date;
  @ApiPropertyOptional() contractEnd?: Date | null;
  @ApiProperty() salaryType!: string;
  @ApiProperty() salaryAmount!: string;
  @ApiProperty() hasTransportSubsidy!: boolean;
  @ApiProperty() isExemptFromTax!: boolean;
  @ApiProperty() epsName!: string;
  @ApiProperty() pensionFundName!: string;
  @ApiProperty() cesantiasFundName!: string;
  @ApiProperty() arlName!: string;
  @ApiProperty() arlRiskLevel!: string;
  @ApiProperty() cajaCompensacion!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiPropertyOptional() deletedAt?: Date | null;
  @ApiPropertyOptional() user?: {
    email: string;
    cedula: string;
    documentType: string;
  };
}

export function toEmployeeResponse(
  employee: EmployeeDetails & { user?: User | null },
): EmployeeResponseDto {
  return {
    id: employee.id,
    userId: employee.userId,
    tenantId: employee.tenantId,
    locationId: employee.locationId,
    position: employee.position,
    area: employee.area,
    department: employee.department,
    contractType: employee.contractType,
    hireDate: employee.hireDate,
    contractStart: employee.contractStart,
    contractEnd: employee.contractEnd,
    salaryType: employee.salaryType,
    salaryAmount: employee.salaryAmount.toString(),
    hasTransportSubsidy: employee.hasTransportSubsidy,
    isExemptFromTax: employee.isExemptFromTax,
    epsName: employee.epsName,
    pensionFundName: employee.pensionFundName,
    cesantiasFundName: employee.cesantiasFundName,
    arlName: employee.arlName,
    arlRiskLevel: employee.arlRiskLevel,
    cajaCompensacion: employee.cajaCompensacion,
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
  };
}
