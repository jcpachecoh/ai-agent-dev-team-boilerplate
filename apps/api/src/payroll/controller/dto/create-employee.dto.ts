import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsDateString,
} from 'class-validator';
import { EmployeeContractType, SalaryType, ArlRiskLevel, DocumentType } from '@prisma/client';

export class CreateEmployeeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cedula!: string;

  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType!: DocumentType;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  roleId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  locationId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  position!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  area!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  department!: string;

  @ApiProperty({ enum: EmployeeContractType })
  @IsEnum(EmployeeContractType)
  @IsNotEmpty()
  contractType!: EmployeeContractType;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  hireDate!: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  contractStart!: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  contractEnd?: string;

  @ApiProperty({ enum: SalaryType })
  @IsEnum(SalaryType)
  @IsNotEmpty()
  salaryType!: SalaryType;

  @ApiProperty({ type: 'number', example: 2000000 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  salaryAmount!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  epsName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pensionFundName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cesantiasFundName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  arlName!: string;

  @ApiProperty({ enum: ArlRiskLevel })
  @IsEnum(ArlRiskLevel)
  @IsNotEmpty()
  arlRiskLevel!: ArlRiskLevel;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cajaCompensacion!: string;
}
