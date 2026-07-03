import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { EmployeeRelationshipType } from '@prisma/client';

const ALLOWED_TYPES = [
  EmployeeRelationshipType.CHILD,
  EmployeeRelationshipType.SPOUSE,
  EmployeeRelationshipType.TUTOR,
] as const;

export type BeneficiaryRelationshipType = (typeof ALLOWED_TYPES)[number];

export class CreateBeneficiaryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ enum: ALLOWED_TYPES })
  @IsEnum(ALLOWED_TYPES)
  relationshipType!: BeneficiaryRelationshipType;

  @ApiProperty({ minimum: 0, maximum: 99 })
  @IsInt()
  @Min(0)
  @Max(99)
  age!: number;
}
