import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class StartOrderDto {
  @ApiProperty({ example: 'work-station-uuid' })
  @IsString()
  @IsNotEmpty()
  workStationId!: string;
}
