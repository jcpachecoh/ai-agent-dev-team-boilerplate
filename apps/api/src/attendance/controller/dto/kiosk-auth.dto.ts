import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';
import type { KioskAuthInput } from '../../interfaces/attendance.interfaces';

export class KioskAuthDto implements KioskAuthInput {
  @ApiProperty({ example: '12345678', description: 'Cédula del empleado (8–11 dígitos)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{8,11}$/, { message: 'Credenciales inválidas' })
  cedula!: string;

  @ApiProperty({ example: '1234', description: 'PIN del empleado (4–6 dígitos)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4,6}$/, { message: 'Credenciales inválidas' })
  pin!: string;
}
