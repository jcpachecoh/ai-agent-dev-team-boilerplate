import { ApiProperty } from '@nestjs/swagger';
import { OperationalRole } from '@prisma/client';

export class MesUserResponseDto {
  @ApiProperty({ example: 'clxyz123' })
  id!: string;

  @ApiProperty({
    description: 'Cédula enmascarada (últimos 4 dígitos visibles)',
    example: '****5678',
  })
  cedula!: string;

  @ApiProperty({ enum: OperationalRole, example: OperationalRole.OPERATOR })
  role!: OperationalRole;

  @ApiProperty({ example: 'tenant-uuid' })
  tenantId!: string;

  @ApiProperty({ example: 'sede-uuid', nullable: true, required: false })
  sedeId!: string | null;
}

export class MesAuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken!: string;
}

export class MesMeResponseDto {
  @ApiProperty({ example: 'clxyz123' })
  id!: string;

  @ApiProperty({ enum: OperationalRole, example: OperationalRole.OPERATOR })
  role!: OperationalRole;

  @ApiProperty({ example: 'tenant-uuid' })
  tenantId!: string;

  @ApiProperty({ example: 'sede-uuid', nullable: true, required: false })
  sedeId!: string | null;
}

export class MesRoleResponseDto {
  @ApiProperty({ enum: OperationalRole, example: OperationalRole.OPERATOR })
  role!: OperationalRole;
}
