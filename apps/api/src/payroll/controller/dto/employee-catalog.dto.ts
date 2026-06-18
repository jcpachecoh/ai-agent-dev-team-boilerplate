import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeCatalogType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ListEmployeeCatalogQueryDto {
  @ApiPropertyOptional({ enum: EmployeeCatalogType })
  @IsEnum(EmployeeCatalogType)
  @IsOptional()
  type?: EmployeeCatalogType;
}

export class EmployeeCatalogOptionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: EmployeeCatalogType })
  type!: EmployeeCatalogType;

  @ApiProperty()
  name!: string;
}
