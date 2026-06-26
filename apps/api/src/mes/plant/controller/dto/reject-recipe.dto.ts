import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectRecipeDto {
  @ApiProperty({ example: 'Faltan validaciones de temperatura en las fases.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}
