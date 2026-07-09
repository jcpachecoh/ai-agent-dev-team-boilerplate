import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateMedicalLeaveStatusDto {
  @ApiProperty({ enum: LeaveStatus })
  @IsEnum(LeaveStatus)
  status!: LeaveStatus;

  @ApiPropertyOptional({ description: 'Obligatorio cuando status es RECHAZADA' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
