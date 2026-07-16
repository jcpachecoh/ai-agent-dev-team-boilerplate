import { EmployeeCatalogType, PrismaClient } from '@prisma/client';

import { employeeCatalogOptionClient } from './employee-catalog-prisma';
import {
  PILA_ADMIN_CODES_SOURCE,
  PILA_CATALOG_SEED_ROWS,
} from '../../src/payroll/constants/pila-admin-codes';
import { catalogSeedPilaCodeUpdate } from '../../src/payroll/utils/pila-master-data.util';

function catalogOptionId(tenantId: string, type: EmployeeCatalogType, name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `seed-catalog-${tenantId}-${type.toLowerCase()}-${slug}`;
}

export async function seedEmployeeCatalogOptions(
  prisma: PrismaClient,
  tenantId: string,
): Promise<void> {
  const catalog = employeeCatalogOptionClient(prisma);
  const activeIds = new Set<string>();
  let withCode = 0;
  let withoutCode = 0;

  for (const row of PILA_CATALOG_SEED_ROWS) {
    const id = catalogOptionId(tenantId, row.type, row.name);
    activeIds.add(id);
    if (row.pilaCode) {
      withCode += 1;
    } else {
      withoutCode += 1;
    }
    // Idempotente: si el seed no trae pilaCode oficial, no pisa un código manual existente.
    await catalog.upsert({
      where: { id },
      update: {
        name: row.name,
        isActive: true,
        type: row.type,
        ...catalogSeedPilaCodeUpdate(row.pilaCode),
      },
      create: {
        id,
        tenantId,
        type: row.type,
        name: row.name,
        pilaCode: row.pilaCode,
        isActive: true,
      },
    });
  }

  const catalogTypes = [
    ...new Set(PILA_CATALOG_SEED_ROWS.map((row) => row.type)),
  ] as EmployeeCatalogType[];

  await catalog.updateMany({
    where: {
      tenantId,
      type: { in: catalogTypes },
      id: { notIn: [...activeIds] },
      isActive: true,
    },
    data: { isActive: false },
  });

  const total = await catalog.count({
    where: { tenantId, isActive: true },
  });

  console.log(
    `EmployeeCatalogOptions: seeded ${total} active options for tenant ${tenantId}` +
      ` (pilaCode set=${withCode}, unset=${withoutCode}; source=${PILA_ADMIN_CODES_SOURCE.primary})`,
  );
}
