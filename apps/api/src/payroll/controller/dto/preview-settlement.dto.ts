import { ContractTerminationReason } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

// Convención `*Dto` del módulo (misma forma que las ~300 DTOs existentes del repo; el
// "suffix" de la regla no incluye "Dto" — deuda preexistente del repo, no corresponde
// arreglarla aquí).
// eslint-disable-next-line @typescript-eslint/naming-convention
export class PreviewSettlementDto {
  @IsString()
  employeeDetailsId!: string;

  @IsDateString()
  effectiveTerminationDate!: string;

  @IsEnum(ContractTerminationReason)
  terminationReason!: ContractTerminationReason;

  /** Solo aplica a contratos OBRA_LABOR — días restantes estimados. */
  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedRemainingDays?: number;

  @IsOptional()
  @IsString()
  estimatedRemainingDaysJustification?: string;
}
