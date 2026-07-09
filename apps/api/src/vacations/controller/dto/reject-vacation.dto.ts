import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectVacationDto {
  @ApiProperty({ description: 'Motivo obligatorio de rechazo' })
  @IsString()
  @IsNotEmpty()
  rejectionReason!: string;
}
