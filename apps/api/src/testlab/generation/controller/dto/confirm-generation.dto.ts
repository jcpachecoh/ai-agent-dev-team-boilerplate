import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

class MilestoneDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsOptional()
  dueDate?: string;
}

class RequirementDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  externalId!: string;
}

class TestCaseDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  preconditions!: string;

  @IsString()
  @IsNotEmpty()
  steps!: string;

  @IsString()
  @IsNotEmpty()
  expectedResult!: string;

  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  priority!: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @IsEnum(['FUNCTIONAL', 'REGRESSION', 'SMOKE', 'ACCEPTANCE'])
  type!: 'FUNCTIONAL' | 'REGRESSION' | 'SMOKE' | 'ACCEPTANCE';
}

export class ConfirmGenerationDto {
  @IsString()
  @IsNotEmpty()
  suiteId!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MilestoneDto)
  milestone?: MilestoneDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequirementDto)
  requirements!: RequirementDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestCaseDto)
  testCases!: TestCaseDto[];
}
