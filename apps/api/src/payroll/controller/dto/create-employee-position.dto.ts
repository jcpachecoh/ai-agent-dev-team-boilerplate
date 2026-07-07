import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class CreateEmployeePositionDto {
  @ApiProperty({ example: 'Analista de Nómina' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @ApiProperty({ example: 'Administración' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  area!: string;

  @ApiProperty({ example: 4500000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  baseSalaryRange!: number;
}
