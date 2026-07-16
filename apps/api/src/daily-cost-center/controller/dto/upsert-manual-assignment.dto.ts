import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpsertManualAssignmentDto {
  @ApiProperty({ description: 'ID de la sede (Location) a asignar para el día' })
  @IsString()
  @IsNotEmpty()
  locationId!: string;
}
