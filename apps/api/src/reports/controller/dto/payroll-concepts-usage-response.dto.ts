import { ApiProperty } from '@nestjs/swagger';

import { PAYROLL_CONCEPT_USAGE_STATUSES } from '../../../payroll/interfaces/payroll-concepts-usage.interfaces';

// eslint-disable-next-line @typescript-eslint/naming-convention
export class SettlementLineUsageExampleDto {
  @ApiProperty() settlementId!: string;
  @ApiProperty() settlementStatus!: string;
  @ApiProperty() lineId!: string;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export class SettlementLineUsageRowDto {
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: PAYROLL_CONCEPT_USAGE_STATUSES })
  status!: (typeof PAYROLL_CONCEPT_USAGE_STATUSES)[number];
  @ApiProperty({ nullable: true, type: String }) catalogDisplayName!: string | null;
  @ApiProperty() usageCount!: number;
  @ApiProperty({ type: [SettlementLineUsageExampleDto] })
  examples!: SettlementLineUsageExampleDto[];
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export class PayrollConceptsUsageSummaryDto {
  @ApiProperty() distinctPairs!: number;
  @ApiProperty() cataloged!: number;
  @ApiProperty() uncataloged!: number;
  @ApiProperty() inactive!: number;
  @ApiProperty() nameMismatch!: number;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export class Os380FieldCoverageItemDto {
  @ApiProperty() field!: string;
  @ApiProperty() conceptCode!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty() lineNature!: string;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export class Os380FieldCoverageDto {
  @ApiProperty({
    description:
      'Cobertura estática del adapter. No implica ledger mensual OS-380 ni conceptId en período.',
  })
  note!: string;
  @ApiProperty({ type: [Os380FieldCoverageItemDto] })
  fields!: Os380FieldCoverageItemDto[];
  @ApiProperty() mappedFieldCount!: number;
}

/** GET /api/reports/payroll-concepts/usage — OS-612 Fase 5 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class PayrollConceptsUsageResponseDto {
  @ApiProperty() tenantId!: string;
  @ApiProperty() generatedAt!: string;
  @ApiProperty({ type: [SettlementLineUsageRowDto] })
  settlementLineUsages!: SettlementLineUsageRowDto[];
  @ApiProperty({ type: PayrollConceptsUsageSummaryDto })
  summary!: PayrollConceptsUsageSummaryDto;
  @ApiProperty({ type: Os380FieldCoverageDto })
  os380FieldCoverage!: Os380FieldCoverageDto;
}
