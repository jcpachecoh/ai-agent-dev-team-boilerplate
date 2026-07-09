import { ApiProperty } from '@nestjs/swagger';
import { VacationType } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class RequestVacationDto {
  @ApiProperty({ description: 'EmployeeDetails.id del solicitante' })
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @ApiProperty({ example: '2026-07-01' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-07-15' })
  @IsDateString()
  endDate!: string;

  @ApiProperty({ enum: VacationType })
  @IsEnum(VacationType)
  type!: VacationType;
}
