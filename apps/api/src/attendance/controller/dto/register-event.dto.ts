import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import type { RegisterEntryInput, RegisterExitInput } from '../../interfaces/attendance.interfaces';

export class RegisterEntryDto implements RegisterEntryInput {
  @ApiProperty({ description: 'User ID del empleado (obtenido en kiosk-auth)' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ description: 'ID de la sede donde se registra la entrada' })
  @IsString()
  @IsNotEmpty()
  locationId!: string;

  @ApiPropertyOptional({ description: 'Notas opcionales del operador del kiosko' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RegisterExitDto implements RegisterExitInput {
  @ApiProperty({ description: 'User ID del empleado (obtenido en kiosk-auth)' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ description: 'ID de la sede donde se registra la salida' })
  @IsString()
  @IsNotEmpty()
  locationId!: string;

  @ApiPropertyOptional({ description: 'Notas opcionales del operador del kiosko' })
  @IsString()
  @IsOptional()
  notes?: string;
}
