import { FinalSettlementMode } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

import { PreviewSettlementDto } from './preview-settlement.dto';

// Convención `*Dto` del módulo (misma forma que las ~300 DTOs existentes del repo; el
// "suffix" de la regla no incluye "Dto" — deuda preexistente del repo, no corresponde
// arreglarla aquí).
// eslint-disable-next-line @typescript-eslint/naming-convention
export class CalculateSettlementDto extends PreviewSettlementDto {
  @IsOptional()
  @IsEnum(FinalSettlementMode)
  mode?: FinalSettlementMode;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  acceptedWarnings?: string[];

  /** Requerido cuando mode=MANUAL. */
  @IsOptional()
  @IsString()
  manualJustification?: string;

  @IsOptional()
  @IsString()
  manualReference?: string;

  @IsOptional()
  @IsString()
  manualResponsible?: string;
}
