import { IsInt, Max, Min } from 'class-validator';

export class ExportCesantiasDto {
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;
}
