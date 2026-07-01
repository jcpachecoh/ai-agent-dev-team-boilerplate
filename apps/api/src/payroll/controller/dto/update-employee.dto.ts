import { PartialType } from '@nestjs/swagger';
import { CreateEmployeeDto } from './create-employee.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  photoStorageObjectId?: string | null;
}
