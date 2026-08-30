import { ApiProperty } from '@nestjs/swagger';

export class MesLocationSummaryDto {
  @ApiProperty({ example: 'clxyz123location' })
  id!: string;

  @ApiProperty({ example: 'Sede Palos de Leña 1' })
  name!: string;

  @ApiProperty({ example: 'PL-01', nullable: true })
  code!: string | null;

  @ApiProperty({ example: 'Bogotá', nullable: true })
  city!: string | null;

  @ApiProperty({ example: 'Calle 1 # 10-20, Bogotá', nullable: true })
  address!: string | null;
}
