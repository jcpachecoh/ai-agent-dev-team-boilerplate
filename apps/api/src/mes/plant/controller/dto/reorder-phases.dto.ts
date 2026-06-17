import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

/** Single item in PATCH /plant/recipes/:id/phases/reorder body (JSON array). */
export class ReorderPhaseItemDto {
  @ApiProperty({ example: 'phase-uuid' })
  @IsString()
  @IsNotEmpty()
  phaseId!: string;

  @ApiProperty({ example: 1, description: 'New sequence position (1-based)' })
  @IsInt()
  @Min(1)
  newOrder!: number;
}
