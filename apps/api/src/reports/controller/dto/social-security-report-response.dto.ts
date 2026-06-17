import { ApiProperty } from '@nestjs/swagger';
import { EmployeeContractType } from '@prisma/client';

export class SocialSecurityEmployeeRowDto {
  @ApiProperty() employeeId!: string;
  @ApiProperty() employeeName!: string;
  @ApiProperty() cedula!: string;
  @ApiProperty() locationId!: string;
  @ApiProperty() locationName!: string;
  @ApiProperty({ enum: EmployeeContractType }) contractType!: EmployeeContractType;
  @ApiProperty() salaryBase!: number;
  @ApiProperty() healthEmployer!: number;
  @ApiProperty() pensionEmployer!: number;
  @ApiProperty() arlEmployer!: number;
  @ApiProperty() senaEmployer!: number;
  @ApiProperty() icbfEmployer!: number;
  @ApiProperty() compensationFundEmployer!: number;
  @ApiProperty() totalEmployerContribution!: number;
}

export class SocialSecurityReportResponseDto {
  @ApiProperty() tenantId!: string;
  @ApiProperty() period!: { year: number; month: number };
  @ApiProperty({ type: [SocialSecurityEmployeeRowDto] })
  employees!: SocialSecurityEmployeeRowDto[];
  /** Sum of all employee totalEmployerContribution values (PILA total) */
  @ApiProperty() totalPILAContribution!: number;
}
