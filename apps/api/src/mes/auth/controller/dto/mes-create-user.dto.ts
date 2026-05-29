import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OperationalRole } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, ValidateIf } from 'class-validator';

export class MesCreateUserDto {
  @ApiProperty({
    description: 'Cédula del operador (8–11 dígitos numéricos)',
    example: '98765432',
  })
  @IsString()
  @Matches(/^\d{8,11}$/, { message: 'cedula must be 8–11 numeric digits' })
  cedula!: string;

  @ApiProperty({
    description: 'PIN inicial del operador (4–6 dígitos numéricos)',
    example: '5678',
  })
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'pin must be 4–6 numeric digits' })
  pin!: string;

  @ApiProperty({ enum: OperationalRole, example: OperationalRole.OPERATOR })
  @IsEnum(OperationalRole)
  role!: OperationalRole;

  @ApiPropertyOptional({
    description: 'Sede asignada (obligatoria para rol OPERATOR)',
    example: 'sede-principal',
  })
  @ValidateIf((dto: MesCreateUserDto) => dto.role === OperationalRole.OPERATOR)
  @IsNotEmpty({ message: 'sedeId is required for OPERATOR role' })
  @IsString()
  @ValidateIf((dto: MesCreateUserDto) => dto.role !== OperationalRole.OPERATOR)
  @IsOptional()
  @IsString()
  sedeId?: string;
}
