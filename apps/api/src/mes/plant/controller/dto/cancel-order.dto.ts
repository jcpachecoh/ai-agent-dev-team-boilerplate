import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ConsumedInputsAction } from '../../interfaces/plant.interfaces';

export class CancelOrderDto {
  @ApiProperty({ example: 'Cliente canceló pedido' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  reason!: string;

  @ApiPropertyOptional({
    enum: ConsumedInputsAction,
    description:
      'Required when cancelling an order in IN_PROCESS or PAUSED (enforced in service). ' +
      'Audit-only in MES-05 — no inventory movements.',
    example: ConsumedInputsAction.SCRAP,
  })
  @IsEnum(ConsumedInputsAction)
  @IsOptional()
  consumedInputsAction?: ConsumedInputsAction;
}
