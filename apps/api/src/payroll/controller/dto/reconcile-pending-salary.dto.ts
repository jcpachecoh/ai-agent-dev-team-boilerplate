import { IsDateString, IsNumberString, IsOptional, IsString } from 'class-validator';

// Convención `*Dto` del módulo (misma forma que las ~300 DTOs existentes del repo; el
// "suffix" de la regla no incluye "Dto" — deuda preexistente del repo, no corresponde
// arreglarla aquí).
// eslint-disable-next-line @typescript-eslint/naming-convention
export class ReconcilePendingSalaryDto {
  @IsNumberString()
  previouslyPaidAmount!: string;

  @IsOptional()
  @IsString()
  paymentReference?: string;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsString()
  responsible!: string;

  @IsString()
  observation!: string;

  @IsNumberString()
  recognizedBalance!: string;
}
