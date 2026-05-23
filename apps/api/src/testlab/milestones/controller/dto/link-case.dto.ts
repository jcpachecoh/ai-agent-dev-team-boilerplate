import { IsString } from 'class-validator';

export class LinkCaseDto {
  @IsString()
  caseId!: string;
}
