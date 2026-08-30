import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class PauseOrderDto {
  @ApiProperty({ example: 'Falla en línea de mezclado' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  reason!: string;
}
