import { ApiProperty } from '@nestjs/swagger';
import { TurnoJornada, TurnoTipo } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { HH_MM_REGEX } from '../../turnos.constants';

export class CreateTurnoDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @ApiProperty({ maxLength: 30 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  sigla!: string;

  @ApiProperty({ enum: TurnoTipo })
  @IsEnum(TurnoTipo)
  tipo!: TurnoTipo;

  @ApiProperty({ enum: TurnoJornada })
  @IsEnum(TurnoJornada)
  jornada!: TurnoJornada;

  @ApiProperty({ example: '06:00' })
  @IsString()
  @Matches(HH_MM_REGEX, { message: 'horaInicio debe tener formato HH:mm' })
  horaInicio!: string;

  @ApiProperty({ example: '14:00' })
  @IsString()
  @Matches(HH_MM_REGEX, { message: 'horaFin debe tener formato HH:mm' })
  horaFin!: string;
}

export class UpdateTurnoDto extends CreateTurnoDto {}
