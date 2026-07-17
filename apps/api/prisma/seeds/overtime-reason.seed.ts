import { EmployeeCatalogType, PrismaClient } from '@prisma/client';

/** Tenant demo operativo — no GLOBAL / LaborLegalParameter. */
export const OS606_OVERTIME_REASON_TENANT_ID = 'palos-de-lena';

export const OS606_OVERTIME_REASON_NAMES = [
  'Inventario físico semana',
  'Inventario físico mensual',
  'Aseo',
] as const;

export type Os606OvertimeReasonName = (typeof OS606_OVERTIME_REASON_NAMES)[number];

/**
 * ID determinista alineado a `catalogOptionId` de employee-catalog.seed.ts
 * (slug NFKD + lowercase) para evitar duplicados por casing/espacios/IDs variables.
 */
export function overtimeReasonCatalogOptionId(
  tenantId: string,
  name: Os606OvertimeReasonName | string,
): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `seed-catalog-${tenantId}-${EmployeeCatalogType.OVERTIME_REASON.toLowerCase()}-${slug}`;
}

export const OS606_OVERTIME_REASON_OPTION_IDS = {
  inventarioFisicoSemana: overtimeReasonCatalogOptionId(
    OS606_OVERTIME_REASON_TENANT_ID,
    'Inventario físico semana',
  ),
  inventarioFisicoMensual: overtimeReasonCatalogOptionId(
    OS606_OVERTIME_REASON_TENANT_ID,
    'Inventario físico mensual',
  ),
  aseo: overtimeReasonCatalogOptionId(OS606_OVERTIME_REASON_TENANT_ID, 'Aseo'),
} as const;

export const OS606_OVERTIME_REASON_SEED_ROWS: ReadonlyArray<{
  id: string;
  tenantId: string;
  type: EmployeeCatalogType;
  name: Os606OvertimeReasonName;
  pilaCode: string | null;
}> = OS606_OVERTIME_REASON_NAMES.map((name) => ({
  id: overtimeReasonCatalogOptionId(OS606_OVERTIME_REASON_TENANT_ID, name),
  tenantId: OS606_OVERTIME_REASON_TENANT_ID,
  type: EmployeeCatalogType.OVERTIME_REASON,
  name,
  pilaCode: null,
}));

/**
 * Motivos OVERTIME_REASON para tenant demo.
 * Idempotente por @@unique([tenantId, type, name]).
 * No fuerza isActive=true en update — conserva desactivación/edición del cliente.
 */
export async function seedOvertimeReasonOptions(
  prisma: PrismaClient,
  tenantId: string = OS606_OVERTIME_REASON_TENANT_ID,
): Promise<void> {
  if (tenantId !== OS606_OVERTIME_REASON_TENANT_ID) {
    console.warn(
      `OvertimeReason seed: tenant "${tenantId}" fuera de alcance MVP — solo ${OS606_OVERTIME_REASON_TENANT_ID}`,
    );
    return;
  }

  for (const row of OS606_OVERTIME_REASON_SEED_ROWS) {
    await prisma.employeeCatalogOption.upsert({
      where: {
        tenantId_type_name: {
          tenantId: row.tenantId,
          type: row.type,
          name: row.name,
        },
      },
      // No reactivar ni pisar ediciones del cliente en re-seed.
      update: {
        // Garantiza id estable si la fila existía con otro id (migración/manual).
        // Prisma no permite cambiar @id en update — si hay colisión de name con otro id,
        // el unique ya evita duplicados; re-seed mantiene la fila existente.
        pilaCode: null,
      },
      create: {
        id: row.id,
        tenantId: row.tenantId,
        type: row.type,
        name: row.name,
        pilaCode: null,
        isActive: true,
      },
    });
  }

  const activeCount = await prisma.employeeCatalogOption.count({
    where: {
      tenantId,
      type: EmployeeCatalogType.OVERTIME_REASON,
      isActive: true,
    },
  });

  console.log(
    `✅ OS-606 OVERTIME_REASON: ${OS606_OVERTIME_REASON_SEED_ROWS.length} motivos upsert ` +
      `(tenant=${tenantId}, active=${activeCount})`,
  );
  for (const row of OS606_OVERTIME_REASON_SEED_ROWS) {
    console.log(`    • ${row.name} → ${row.id}`);
  }
}
