import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateEmployeePositionDto } from './create-employee-position.dto';

export class UpdateEmployeePositionDto extends PartialType(CreateEmployeePositionDto) {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
