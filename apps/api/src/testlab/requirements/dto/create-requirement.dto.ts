import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateRequirementDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
