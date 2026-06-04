import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchIssuesDto {
  @IsString()
  @IsNotEmpty()
  projectKey!: string;

  @IsString()
  @IsOptional()
  query?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}
