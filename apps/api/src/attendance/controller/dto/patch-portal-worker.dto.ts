import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class PatchPortalWorkerDto {
  @ApiProperty({ description: 'Nuevo valor del flag Portal trabajador' })
  @IsBoolean()
  enabled!: boolean;
}

export class PortalWorkerResponseDto {
  @ApiProperty() portalWorkerEnabled!: boolean;
}
