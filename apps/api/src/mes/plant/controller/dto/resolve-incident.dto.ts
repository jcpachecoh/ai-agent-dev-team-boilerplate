import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResolveIncidentDto {
  @ApiProperty({ example: 'Se ajustó temperatura del horno y se reinició la fase' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  resolution!: string;
}
