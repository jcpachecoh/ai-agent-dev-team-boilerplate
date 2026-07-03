import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EmployeeContractType,
  SalaryType,
  ArlRiskLevel,
  DocumentType,
  CostCenter,
  LaborClassification,
} from '@prisma/client';
import { CreateBeneficiaryDto } from './create-beneficiary.dto';

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

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  positionId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  position?: string;

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

  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  barrio?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  localidad?: string;

  @ApiProperty({ enum: CostCenter })
  @IsEnum(CostCenter)
  @IsNotEmpty()
  costCenter!: CostCenter;

  @ApiProperty({ enum: LaborClassification })
  @IsEnum(LaborClassification)
  @IsNotEmpty()
  laborClassification!: LaborClassification;

  @ApiPropertyOptional({ type: 'number', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  nonSalaryAmount?: number;

  @ApiPropertyOptional({ type: [CreateBeneficiaryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBeneficiaryDto)
  @IsOptional()
  beneficiaries?: CreateBeneficiaryDto[];
}
