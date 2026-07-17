import { Injectable } from '@nestjs/common';
import type { PayrollConcept } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreatePayrollConceptRecord,
  IPayrollConceptsRepository,
} from '../interfaces/payroll-concepts.interfaces';

@Injectable()
export class PayrollConceptsRepository implements IPayrollConceptsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveByScopeAndCode(
    tenantScope: string,
    code: string,
  ): Promise<PayrollConcept | null> {
    return this.prisma.payrollConcept.findFirst({
      where: { tenantScope, code, deletedAt: null },
    });
  }

  async findByScopeAndCodeIncludingDeleted(
    tenantScope: string,
    code: string,
  ): Promise<PayrollConcept | null> {
    return this.prisma.payrollConcept.findUnique({
      where: { tenantScope_code: { tenantScope, code } },
    });
  }

  async create(data: CreatePayrollConceptRecord): Promise<PayrollConcept> {
    return this.prisma.payrollConcept.create({
      data: {
        tenantId: data.tenantId,
        tenantScope: data.tenantScope,
        code: data.code,
        displayName: data.displayName,
        lineNature: data.lineNature,
      },
    });
  }

  async updateDisplayName(id: string, displayName: string): Promise<PayrollConcept> {
    return this.prisma.payrollConcept.update({
      where: { id },
      data: { displayName },
    });
  }
}
