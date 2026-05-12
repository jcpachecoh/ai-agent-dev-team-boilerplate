import { IsString, IsOptional, MaxLength, IsDateString } from 'class-validator';

export class CreateMilestoneDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
