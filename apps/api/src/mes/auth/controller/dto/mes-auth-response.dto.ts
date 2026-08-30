import { ApiProperty } from '@nestjs/swagger';
import { OperationalRole } from '@prisma/client';
import { MesLocationSummaryDto } from './mes-location-summary.dto';

export class MesOperatorResponseDto {
  @ApiProperty({ example: 'clxyz123' })
  id!: string;

  @ApiProperty({ enum: OperationalRole, example: OperationalRole.OPERATOR })
  role!: OperationalRole;

  @ApiProperty({ example: 'tenant-uuid' })
  tenantId!: string;

  @ApiProperty({ example: 'clxyz123location', nullable: true, required: false })
  locationId!: string | null;
}

export class MesUserResponseDto extends MesOperatorResponseDto {
  @ApiProperty({
    description: 'Cédula enmascarada (últimos 4 dígitos visibles)',
    example: '****5678',
  })
  cedula!: string;
}

export class MesAuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken!: string;

  @ApiProperty({ type: MesOperatorResponseDto })
  operator!: MesOperatorResponseDto;

  @ApiProperty({ type: [MesLocationSummaryDto] })
  locations!: MesLocationSummaryDto[];

  @ApiProperty({
    description: 'True cuando el operador debe elegir sede antes de operar',
    example: false,
  })
  requiresLocationSelection!: boolean;
}

export class MesMeResponseDto extends MesOperatorResponseDto {}

export class MesRoleResponseDto {
  @ApiProperty({ enum: OperationalRole, example: OperationalRole.OPERATOR })
  role!: OperationalRole;
}
