import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeContractType, SalaryType } from '@prisma/client';

export class OvertimeBreakdownItemDto {
  @ApiProperty() type!: string;
  @ApiProperty() minutes!: number;
  @ApiProperty() hourlyRate!: number;
  @ApiProperty() surchargeRate!: number;
  @ApiProperty() amount!: number;
}

export class PayrollEmployeeRowDto {
  @ApiProperty() employeeId!: string;
  @ApiProperty() employeeName!: string;
  @ApiProperty() cedula!: string;
  @ApiProperty() locationId!: string;
  @ApiProperty() locationName!: string;
  @ApiProperty({ enum: EmployeeContractType }) contractType!: EmployeeContractType;
  @ApiProperty({ enum: SalaryType }) salaryType!: SalaryType;
  @ApiProperty() salaryAmount!: number;
  @ApiProperty() workedDays!: number;
  @ApiProperty() calendarDays!: number;
  @ApiProperty() salaryBase!: number;
  @ApiProperty() transportSubsidy!: number;
  @ApiProperty() overtimePay!: number;
  @ApiProperty({ type: [OvertimeBreakdownItemDto] }) overtimeBreakdown!: OvertimeBreakdownItemDto[];
  @ApiProperty() grossPay!: number;
  @ApiProperty() healthDeduction!: number;
  @ApiProperty() pensionDeduction!: number;
  @ApiProperty() incomeTaxWithholding!: number;
  @ApiProperty() totalDeductions!: number;
  @ApiProperty() netPay!: number;
  @ApiProperty() employerHealthContribution!: number;
  @ApiProperty() employerPensionContribution!: number;
  @ApiProperty() employerArlContribution!: number;
  @ApiProperty() employerSenaContribution!: number;
  @ApiProperty() employerIcbfContribution!: number;
  @ApiProperty() employerCajaContribution!: number;
  @ApiProperty() totalEmployerContributions!: number;
  @ApiProperty() totalPayrollCost!: number;
  @ApiProperty() medicalLeaveEmployerDays!: number;
  @ApiProperty() medicalLeaveEmployerPay!: number;
  @ApiProperty() medicalLeaveEpsArlDays!: number;
  @ApiProperty() medicalLeaveEpsArlPay!: number;
  @ApiProperty() medicalLeaveOrdinaryDaysExcluded!: number;
}

export class LocationPayrollTotalsDto {
  @ApiProperty() locationId!: string;
  @ApiProperty() locationName!: string;
  @ApiProperty() employeeCount!: number;
  @ApiProperty() totalNetPay!: number;
  @ApiProperty() totalEmployerContributions!: number;
  @ApiProperty() totalPayrollCost!: number;
}

export class TenantPayrollTotalsDto {
  @ApiProperty() employeeCount!: number;
  @ApiProperty() totalGrossPay!: number;
  @ApiProperty() totalDeductions!: number;
  @ApiProperty() totalNetPay!: number;
  @ApiProperty() totalEmployerContributions!: number;
  @ApiProperty() totalPayrollCost!: number;
}

/** CONN-06 / NOM-24 — desglose de prorrateo para empleados ROTANTE. */
export class RotanteProrationAllocationDto {
  @ApiProperty() locationId!: string;
  @ApiProperty() locationName!: string;
  @ApiProperty() days!: number;
  @ApiProperty() proportion!: number;
  @ApiProperty() proratedCost!: number;
}

export class RotanteProrationMetaDto {
  @ApiProperty() employeeId!: string;
  @ApiProperty() totalDaysAssigned!: number;
  @ApiProperty() pendingDaysCount!: number;
  @ApiProperty({ type: [RotanteProrationAllocationDto] })
  allocations!: RotanteProrationAllocationDto[];
}

export class PayrollReportResponseDto {
  @ApiProperty() tenantId!: string;
  @ApiProperty() period!: { year: number; month: number };
  @ApiProperty({ type: [PayrollEmployeeRowDto] }) employees!: PayrollEmployeeRowDto[];
  @ApiProperty() tenantTotals!: TenantPayrollTotalsDto;
  @ApiProperty({ type: [LocationPayrollTotalsDto] }) locationTotals!: LocationPayrollTotalsDto[];
  /** Presente cuando hay empleados ROTANTE en el período (CONN-06). */
  @ApiPropertyOptional({ type: [RotanteProrationMetaDto] })
  prorationMeta?: RotanteProrationMetaDto[];
}
