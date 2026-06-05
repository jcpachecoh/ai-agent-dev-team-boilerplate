import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductionPriority, ProductionShift } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'plannedEndAfterStart', async: false })
class PlannedEndAfterStartConstraint implements ValidatorConstraintInterface {
  validate(plannedEndAt: string, args: ValidationArguments): boolean {
    const obj = args.object as CreateOrderDto;
    if (!obj.plannedStartAt || !plannedEndAt) {
      return true;
    }
    return new Date(plannedEndAt).getTime() > new Date(obj.plannedStartAt).getTime();
  }

  defaultMessage(): string {
    return 'plannedEndAt must be after plannedStartAt';
  }
}

export class CreateOrderDto {
  @ApiProperty({ example: 'recipe-uuid' })
  @IsString()
  @IsNotEmpty()
  recipeId!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  batchCount!: number;

  @ApiProperty({ enum: ProductionShift, example: ProductionShift.MORNING })
  @IsEnum(ProductionShift)
  shift!: ProductionShift;

  @ApiPropertyOptional({ enum: ProductionPriority, default: ProductionPriority.NORMAL })
  @IsEnum(ProductionPriority)
  @IsOptional()
  priority?: ProductionPriority;

  @ApiProperty({ example: '2026-06-01T08:00:00.000Z' })
  @IsDateString()
  plannedStartAt!: string;

  @ApiProperty({ example: '2026-06-01T16:00:00.000Z' })
  @IsDateString()
  @Validate(PlannedEndAfterStartConstraint)
  plannedEndAt!: string;

  @ApiPropertyOptional({ example: 'supervisor-uuid' })
  @IsString()
  @IsOptional()
  supervisorId?: string;

  @ApiPropertyOptional({ example: 'OP urgente para evento' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    example: 'committee-uuid',
    description: 'Active production committee that groups this order (OP number: OP0001-01, …)',
  })
  @IsString()
  @IsNotEmpty()
  committeeId!: string;
}
