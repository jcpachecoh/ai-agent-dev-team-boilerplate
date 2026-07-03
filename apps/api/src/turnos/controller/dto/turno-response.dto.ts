import { ApiProperty } from '@nestjs/swagger';
import { TurnoJornada, TurnoTipo } from '@prisma/client';

export class TurnoResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nombre!: string;

  @ApiProperty()
  sigla!: string;

  @ApiProperty({ enum: TurnoTipo })
  tipo!: TurnoTipo;

  @ApiProperty({ enum: TurnoJornada })
  jornada!: TurnoJornada;

  @ApiProperty({ example: '06:00' })
  horaInicio!: string;

  @ApiProperty({ example: '14:00' })
  horaFin!: string;

  @ApiProperty()
  estado!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class TurnosPaginationDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

export class TurnosListResponseDto {
  @ApiProperty({ type: [TurnoResponseDto] })
  data!: TurnoResponseDto[];

  @ApiProperty({ type: TurnosPaginationDto })
  pagination!: TurnosPaginationDto;
}
