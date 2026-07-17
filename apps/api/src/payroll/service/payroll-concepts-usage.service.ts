import { Injectable } from '@nestjs/common';

import { listOs380ConceptFieldCoverage } from '../adapters/os380-payroll-concept.adapter';
import type {
  PayrollConceptsUsageReport,
  SettlementLineUsageExample,
  SettlementLineUsageRow,
} from '../interfaces/payroll-concepts-usage.interfaces';
import { PrismaService } from '../../prisma/prisma.service';
import { PayrollConceptsService } from './payroll-concepts.service';

const MAX_EXAMPLES_PER_PAIR = 5;

/**
 * OS-612 Fase 5 — reporte read-only usados vs catalogados.
 * Persistido: SettlementLine. OS-380: cobertura estática del adapter (sin ledger mensual).
 */
@Injectable()
export class PayrollConceptsUsageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payrollConcepts: PayrollConceptsService,
  ) {}

  async getUsageReport(tenantId: string): Promise<PayrollConceptsUsageReport> {
    const grouped = await this.prisma.settlementLine.groupBy({
      by: ['code', 'name'],
      where: { tenantId },
      _count: { _all: true },
      orderBy: [{ code: 'asc' }, { name: 'asc' }],
    });

    const settlementLineUsages: SettlementLineUsageRow[] = [];

    for (const row of grouped) {
      const classification = await this.payrollConcepts.classifyLineSnapshot(
        tenantId,
        row.code,
        row.name,
      );
      const examples = await this.loadExamples(tenantId, row.code, row.name);

      settlementLineUsages.push({
        code: row.code,
        name: row.name,
        status: classification.status,
        catalogDisplayName: classification.catalogDisplayName,
        usageCount: row._count._all,
        examples,
      });
    }

    const summary = {
      distinctPairs: settlementLineUsages.length,
      cataloged: settlementLineUsages.filter((r) => r.status === 'CATALOGED').length,
      uncataloged: settlementLineUsages.filter((r) => r.status === 'UNCATALOGED').length,
      inactive: settlementLineUsages.filter((r) => r.status === 'INACTIVE').length,
      nameMismatch: settlementLineUsages.filter((r) => r.status === 'NAME_MISMATCH').length,
    };

    const fields = listOs380ConceptFieldCoverage();

    return {
      tenantId,
      generatedAt: new Date().toISOString(),
      settlementLineUsages,
      summary,
      os380FieldCoverage: {
        note:
          'Cobertura estática campo OS-380 → concept code (adapter). ' +
          'OS-380 no persiste líneas mensuales ni conceptId en EmployeePayrollPeriod.',
        fields,
        mappedFieldCount: fields.length,
      },
    };
  }

  private async loadExamples(
    tenantId: string,
    code: string,
    name: string,
  ): Promise<SettlementLineUsageExample[]> {
    const lines = await this.prisma.settlementLine.findMany({
      where: { tenantId, code, name },
      take: MAX_EXAMPLES_PER_PAIR,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        settlementId: true,
        settlement: { select: { status: true } },
      },
    });

    return lines.map(
      (l): SettlementLineUsageExample => ({
        settlementId: l.settlementId,
        settlementStatus: l.settlement.status,
        lineId: l.id,
      }),
    );
  }
}
