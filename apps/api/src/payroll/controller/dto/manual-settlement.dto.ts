import { ContractTerminationReason, SettlementLineType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

// Convención `*Dto` del módulo (misma forma que las ~300 DTOs existentes del repo; el
// "suffix" de la regla no incluye "Dto" — deuda preexistente del repo, no corresponde
// arreglarla aquí).
// eslint-disable-next-line @typescript-eslint/naming-convention
export class ManualSettlementLineDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsEnum(SettlementLineType)
  type!: SettlementLineType;

  @IsNumberString()
  amount!: string;

  @IsString()
  manualJustification!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @Min(0)
  sortOrder?: number;
}

// Convención `*Dto` del módulo (misma forma que las ~300 DTOs existentes del repo; el
// "suffix" de la regla no incluye "Dto" — deuda preexistente del repo, no corresponde
// arreglarla aquí).
// eslint-disable-next-line @typescript-eslint/naming-convention
export class ManualSettlementDto {
  @IsString()
  employeeDetailsId!: string;

  @IsDateString()
  effectiveTerminationDate!: string;

  @IsEnum(ContractTerminationReason)
  terminationReason!: ContractTerminationReason;

  @IsArray()
  @ValidateNested({ each: true })
  @Type((): typeof ManualSettlementLineDto => ManualSettlementLineDto)
  lines!: ManualSettlementLineDto[];

  @IsString()
  manualJustification!: string;

  @IsString()
  manualReference!: string;

  @IsString()
  manualResponsible!: string;
}
