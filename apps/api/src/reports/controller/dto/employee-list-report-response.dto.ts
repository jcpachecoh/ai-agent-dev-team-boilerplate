import { ApiProperty } from '@nestjs/swagger';

export class EmployeeListRowDto {
  @ApiProperty()
  employeeId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  cedula!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  position!: string;

  @ApiProperty()
  area!: string;

  @ApiProperty()
  department!: string;

  @ApiProperty()
  contractType!: string;

  @ApiProperty()
  locationId!: string;

  @ApiProperty()
  locationName!: string;

  @ApiProperty()
  hireDate!: string;

  @ApiProperty({ nullable: true })
  contractStart!: string | null;

  @ApiProperty({ nullable: true })
  contractEnd!: string | null;

  @ApiProperty()
  salaryAmount!: number;

  @ApiProperty()
  isActive!: boolean;
}

export class EmployeeListReportResponseDto {
  @ApiProperty()
  tenantId!: string;

  @ApiProperty({ type: [String] })
  filtersSummary!: string[];

  @ApiProperty({ type: [EmployeeListRowDto] })
  employees!: EmployeeListRowDto[];
}
