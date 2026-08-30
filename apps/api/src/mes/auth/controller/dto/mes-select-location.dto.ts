import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MesSelectLocationDto {
  @ApiProperty({ description: 'ID de la sede activa seleccionada por el operador' })
  @IsString()
  @IsNotEmpty()
  locationId!: string;
}
