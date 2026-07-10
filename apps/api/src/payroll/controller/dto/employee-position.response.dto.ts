import { ApiProperty } from '@nestjs/swagger';

export class EmployeePositionSupervisorResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;
}

export class EmployeePositionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  area!: string;

  @ApiProperty()
  baseSalaryRange!: number;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: [EmployeePositionSupervisorResponseDto] })
  supervisors!: EmployeePositionSupervisorResponseDto[];
}
