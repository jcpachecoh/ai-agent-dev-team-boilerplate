import { IsString, IsNotEmpty, IsOptional, IsArray, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MilestoneDto {
  @IsString() name!: string;
  @IsString() description!: string;
  @IsString() @IsOptional() dueDate?: string;
}

class RequirementDto {
  @IsString() title!: string;
  @IsString() description!: string;
  @IsString() externalId!: string;
}

class TestCaseDto {
  @IsString() title!: string;
  @IsString() preconditions!: string;
  @IsString() steps!: string;
  @IsString() expectedResult!: string;
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']) priority!: string;
  @IsIn(['FUNCTIONAL', 'REGRESSION', 'SMOKE', 'ACCEPTANCE']) type!: string;
}

export class ConfirmGenerationDto {
  @IsString()
  @IsNotEmpty()
  suiteId!: string;

  @ValidateNested()
  @Type(() => MilestoneDto)
  @IsOptional()
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
