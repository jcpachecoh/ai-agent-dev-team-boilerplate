import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class PatchTurnoEstadoDto {
  @ApiProperty()
  @IsBoolean()
  estado!: boolean;
}
