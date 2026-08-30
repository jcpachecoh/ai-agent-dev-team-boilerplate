import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QaApproveDto {
  @ApiPropertyOptional({ example: 'Inspección visual aprobada' })
  @IsString()
  @IsOptional()
  notes?: string;
}
