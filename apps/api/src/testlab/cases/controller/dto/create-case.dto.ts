import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  @ApiProperty({ maxLength: 200, example: 'Verify login with valid credentials' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ enum: CasePriority, example: CasePriority.MEDIUM })
  @IsOptional()
  @IsEnum(CasePriority)
  priority?: CasePriority;

  @ApiPropertyOptional({ enum: CaseType, example: CaseType.FUNCTIONAL })
  @IsOptional()
  @IsEnum(CaseType)
  type?: CaseType;

  @ApiPropertyOptional({ example: 'User is on the login page' })
  @IsOptional()
  @IsString()
  preconditions?: string;

  @ApiPropertyOptional({ example: 'User is redirected to dashboard' })
  @IsOptional()
  @IsString()
  expectedResult?: string;
}
