import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MesLoginDto {
  @ApiProperty({
    description: 'Cédula del operador (8–11 dígitos numéricos)',
    example: '12345678',
  })
  @IsString()
  @Matches(/^\d{8,11}$/, { message: 'cedula must be 8–11 numeric digits' })
  cedula!: string;

  @ApiProperty({
    description: 'PIN del operador (4–6 dígitos numéricos)',
    example: '1234',
  })
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'pin must be 4–6 numeric digits' })
  pin!: string;
}
