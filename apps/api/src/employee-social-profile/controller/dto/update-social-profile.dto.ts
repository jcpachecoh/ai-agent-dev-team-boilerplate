import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeRelationshipType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsOptional, IsString, MaxDate } from 'class-validator';

export class UpdateSocialProfileDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ enum: EmployeeRelationshipType })
  @IsEnum(EmployeeRelationshipType)
  @IsOptional()
  relationshipType?: EmployeeRelationshipType;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @MaxDate(new Date(), { message: 'La fecha de nacimiento no puede ser futura' })
  @IsOptional()
  birthDate?: Date;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDependent?: boolean;
}
