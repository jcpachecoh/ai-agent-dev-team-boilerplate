import { IsString, IsInt, IsOptional, Min, IsNotEmpty } from 'class-validator';

export class CreateRecipeDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsInt()
  @Min(1)
  porciones!: number;

  @IsString()
  @IsOptional()
  notas?: string;
}
