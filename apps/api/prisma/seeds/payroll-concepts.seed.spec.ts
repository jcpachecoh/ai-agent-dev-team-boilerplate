import type { PrismaClient } from '@prisma/client';

import {
  GLOBAL_TENANT_SCOPE,
  PAYROLL_CONCEPT_DEFINITIONS,
} from '../../src/shared/payroll/payroll-concepts.registry';
import { seedPayrollConcepts } from './payroll-concepts.seed';

function makePrismaMock(): {
  prisma: PrismaClient;
  upsert: jest.Mock;
  executeRaw: jest.Mock;
} {
  const upsert = jest.fn().mockResolvedValue({});
  const executeRaw = jest.fn().mockResolvedValue(0);
  const prisma = {
    payrollConcept: { upsert },
    $executeRaw: executeRaw,
  } as unknown as PrismaClient;
  return { prisma, upsert, executeRaw };
}

describe('seedPayrollConcepts (OS-612 PR1)', (): void => {
  it('es idempotente: segundo seed vuelve a upsertar los mismos codes GLOBAL', async (): Promise<void> => {
    const { prisma, upsert, executeRaw } = makePrismaMock();

    await seedPayrollConcepts(prisma);
    await seedPayrollConcepts(prisma);

    expect(upsert).toHaveBeenCalledTimes(PAYROLL_CONCEPT_DEFINITIONS.length * 2);
    expect(executeRaw).toHaveBeenCalledTimes(2);

    const firstPass = upsert.mock.calls.slice(0, PAYROLL_CONCEPT_DEFINITIONS.length);
    const secondPass = upsert.mock.calls.slice(PAYROLL_CONCEPT_DEFINITIONS.length);

    for (let i = 0; i < PAYROLL_CONCEPT_DEFINITIONS.length; i += 1) {
      const def = PAYROLL_CONCEPT_DEFINITIONS[i];
      const expectedWhere = {
        where: {
          tenantScope_code: { tenantScope: GLOBAL_TENANT_SCOPE, code: def.code },
        },
      };
      expect(firstPass[i][0]).toMatchObject(expectedWhere);
      expect(secondPass[i][0]).toMatchObject(expectedWhere);
      expect(firstPass[i][0].update).not.toHaveProperty('deletedAt');
      expect(secondPass[i][0].update).not.toHaveProperty('deletedAt');
      expect(firstPass[i][0].create.tenantId).toBeNull();
      expect(firstPass[i][0].create).not.toHaveProperty('id');
    }
  });

  it('no escribe overrides de tenant', async (): Promise<void> => {
    const { prisma, upsert } = makePrismaMock();

    await seedPayrollConcepts(prisma);

    for (const call of upsert.mock.calls) {
      const arg = call[0] as {
        where: { tenantScope_code: { tenantScope: string } };
        create: { tenantScope: string; tenantId: string | null };
      };
      expect(arg.where.tenantScope_code.tenantScope).toBe(GLOBAL_TENANT_SCOPE);
      expect(arg.create.tenantScope).toBe(GLOBAL_TENANT_SCOPE);
      expect(arg.create.tenantId).toBeNull();
    }
  });

  it('ejecuta backfill best-effort de settlement_lines.conceptId tras upsert', async (): Promise<void> => {
    const { prisma, executeRaw } = makePrismaMock();
    executeRaw.mockResolvedValue(3);

    await seedPayrollConcepts(prisma);

    expect(executeRaw).toHaveBeenCalledTimes(1);
  });
});
