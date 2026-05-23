import { IsString, IsNotEmpty, IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { JiraEntityType } from '@prisma/client';

export class CreateLinkDto {
  @IsString()
  @IsNotEmpty()
  issueKey!: string;

  @IsEnum(JiraEntityType)
  entityType!: JiraEntityType;

  @IsString()
  @IsNotEmpty()
  entityId!: string;
}
