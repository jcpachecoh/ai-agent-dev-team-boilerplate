import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateDto {
  @IsString()
  @IsNotEmpty()
  issueKey!: string; // Jira issue key, e.g. "PROJ-123"
}
