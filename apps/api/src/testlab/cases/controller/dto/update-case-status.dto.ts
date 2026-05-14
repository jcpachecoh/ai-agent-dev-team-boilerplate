import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ResultStatus {
  UNTESTED = 'UNTESTED',
  PASS = 'PASS',
  FAIL = 'FAIL',
  BLOCKED = 'BLOCKED',
  RETEST = 'RETEST',
  SKIPPED = 'SKIPPED',
}

export class UpdateCaseStatusDto {
  @ApiProperty({ enum: ResultStatus, example: ResultStatus.PASS })
  @IsEnum(ResultStatus)
  status!: ResultStatus;
}
