import { IsEnum } from 'class-validator';

export enum ResultStatus {
  UNTESTED = 'UNTESTED',
  PASS = 'PASS',
  FAIL = 'FAIL',
  BLOCKED = 'BLOCKED',
  RETEST = 'RETEST',
  SKIPPED = 'SKIPPED',
}

export class UpdateCaseStatusDto {
  @IsEnum(ResultStatus)
  status!: ResultStatus;
}
