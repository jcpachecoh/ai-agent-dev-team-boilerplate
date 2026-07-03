import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeRelationshipType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxDate,
} from 'class-validator';

export class CreateSocialProfileDto {
  @ApiProperty({ description: 'Nombre completo del familiar' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ enum: EmployeeRelationshipType })
  @IsEnum(EmployeeRelationshipType)
  @IsNotEmpty()
  relationshipType!: EmployeeRelationshipType;

  @ApiProperty({ description: 'Fecha de nacimiento (no puede ser futura)' })
  @Type(() => Date)
  @IsDate()
  @MaxDate(new Date(), { message: 'La fecha de nacimiento no puede ser futura' })
  birthDate!: Date;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isDependent?: boolean;
}
