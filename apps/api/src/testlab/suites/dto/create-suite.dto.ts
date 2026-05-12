import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateSuiteDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
