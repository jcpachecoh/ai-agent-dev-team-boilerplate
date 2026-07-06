import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DismissAlertDto {
  @ApiProperty({
    example: 'geo-cl123abc',
    description: 'id de la alerta tal como la devuelve control-panel',
  })
  @IsString()
  @IsNotEmpty()
  alertKey!: string;
}
