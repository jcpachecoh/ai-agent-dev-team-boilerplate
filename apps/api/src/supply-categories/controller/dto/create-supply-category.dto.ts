import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateSupplyCategoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({ example: 'ACF', description: 'Prefijo para códigos internos (ej. ACF-000001)' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @Matches(/^[A-Z0-9]{2,6}$/, {
    message: 'prefijo must be 2 to 6 uppercase alphanumeric characters',
  })
  prefijo!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  descripcion?: string;
}
