import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, MaritalStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateEmployeePersonalDataDto {
  @ApiPropertyOptional({ enum: ['CC', 'CE', 'TI', 'PASAPORTE', 'PEP'] })
  @IsOptional()
  @IsString()
  tipoDocumento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^\d{1,15}$/)
  numeroDocumento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombres?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  primerApellido?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  segundoApellido?: string;

  @ApiPropertyOptional({ example: '1990-05-20' })
  @IsOptional()
  @IsString()
  fechaNacimiento?: string;

  @ApiPropertyOptional({ enum: MaritalStatus })
  @IsOptional()
  @IsEnum(MaritalStatus)
  estadoCivil?: MaritalStatus;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  sexo?: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departamento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ciudad?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  localidad?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barrio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  direccion?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsOptional()
  @Matches(/^\d{7,15}$/)
  telefono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  correo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactoEmergenciaNombre?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsOptional()
  @Matches(/^\d{7,15}$/)
  contactoEmergenciaTelefono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactoEmergenciaParentesco?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profilePhotoStorageObjectId?: string | null;
}
