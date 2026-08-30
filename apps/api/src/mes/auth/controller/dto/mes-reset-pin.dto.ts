import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class MesResetPinDto {
  @ApiProperty({
    description: 'Nuevo PIN del operador (4–6 dígitos numéricos)',
    example: '9012',
  })
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'pin must be 4–6 numeric digits' })
  pin!: string;
}
