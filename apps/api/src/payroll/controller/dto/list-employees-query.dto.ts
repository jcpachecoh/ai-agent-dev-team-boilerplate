import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { EmployeeContractType } from '@prisma/client';

export class ListEmployeesQueryDto {
  @IsString()
  @IsOptional()
  locationId?: string;

  @IsEnum(EmployeeContractType)
  @IsOptional()
  contractType?: EmployeeContractType;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  includeInactive?: boolean;

  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  positionId?: string;

  @IsString()
  @IsOptional()
  area?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  employeeId?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @Transform(({ value }) => (value != null ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @Transform(({ value }) => (value != null ? Number(value) : undefined))
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number;
}
