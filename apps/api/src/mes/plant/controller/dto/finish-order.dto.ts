import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FinishOrderDto {
  @ApiPropertyOptional({ example: 'Orden finalizada sin novedades' })
  @IsString()
  @IsOptional()
  notes?: string;
}
