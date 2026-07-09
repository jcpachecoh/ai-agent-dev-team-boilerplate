import { ApiProperty } from '@nestjs/swagger';
import { LeaveOrigin } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateMedicalLeaveDto {
  @ApiProperty({ description: 'EmployeeDetails.id del colaborador' })
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @ApiProperty({ enum: LeaveOrigin })
  @IsEnum(LeaveOrigin)
  origin!: LeaveOrigin;

  @ApiProperty({ example: '2026-03-01' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-03-10' })
  @IsDateString()
  endDate!: string;
}
