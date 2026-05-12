import { IsString, IsInt, IsOptional, Min, IsBoolean } from 'class-validator';

export class UpdateRecipeDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  porciones?: number;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
