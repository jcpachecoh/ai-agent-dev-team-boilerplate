import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class OperatorPauseOrderDto {
  @ApiPropertyOptional({ example: 'Pausa por cambio de turno' })
  @IsString()
  @IsOptional()
  notes?: string;
}
