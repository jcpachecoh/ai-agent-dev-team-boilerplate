import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum CasePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum CaseType {
  FUNCTIONAL = 'FUNCTIONAL',
  REGRESSION = 'REGRESSION',
  SMOKE = 'SMOKE',
  EXPLORATORY = 'EXPLORATORY',
  AUTOMATED = 'AUTOMATED',
  ACCEPTANCE = 'ACCEPTANCE',
}

export class CreateCaseDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsEnum(CasePriority)
  priority?: CasePriority;

  @IsOptional()
  @IsEnum(CaseType)
  type?: CaseType;

  @IsOptional()
  @IsString()
  preconditions?: string;

  @IsOptional()
  @IsString()
  expectedResult?: string;
}
