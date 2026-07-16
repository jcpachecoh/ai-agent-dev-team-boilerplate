/**
 * CONN-12 — seed parcial (solo WeeklyShiftPlan DRAFT + APPROVED).
 *
 * Prerrequisitos:
 * - Migración `conn12_weekly_shift_plan_approval` aplicada
 * - Tenant `palos-de-lena` con al menos 1 Location activa
 *   (si no hay sedes, corre una vez el seed completo)
 *
 * Uso:
 *   cd apps/api && npx tsx prisma/seeds/conn12-weekly-shift-plans.seed.ts
 */

import { PrismaClient, WeeklyShiftPlanStatus } from '@prisma/client';

const TENANT_ID = 'palos-de-lena';
const DRAFT_WEEK_START = new Date('2026-07-20T00:00:00.000Z');
const APPROVED_WEEK_START = new Date('2026-07-13T00:00:00.000Z');

export async function seedWeeklyShiftPlansDemo(
  prisma: PrismaClient,
  locationDraftId: string,
  locationApprovedId: string,
): Promise<void> {
  await prisma.weeklyShiftPlan.upsert({
    where: {
      tenantId_locationId_weekStart: {
        tenantId: TENANT_ID,
        locationId: locationDraftId,
        weekStart: DRAFT_WEEK_START,
      },
    },
    update: {
      status: WeeklyShiftPlanStatus.DRAFT,
      submittedByUserId: null,
      submittedAt: null,
      approvedByUserId: null,
      approvedAt: null,
      rejectedByUserId: null,
      rejectedAt: null,
      rejectionReason: null,
    },
    create: {
      id: 'seed-weekly-plan-draft-conn12',
      tenantId: TENANT_ID,
      locationId: locationDraftId,
      weekStart: DRAFT_WEEK_START,
      status: WeeklyShiftPlanStatus.DRAFT,
    },
  });

  await prisma.weeklyShiftPlan.upsert({
    where: {
      tenantId_locationId_weekStart: {
        tenantId: TENANT_ID,
        locationId: locationApprovedId,
        weekStart: APPROVED_WEEK_START,
      },
    },
    update: {
      status: WeeklyShiftPlanStatus.APPROVED,
      approvedAt: new Date('2026-07-10T15:00:00.000Z'),
      rejectionReason: null,
      rejectedAt: null,
      rejectedByUserId: null,
    },
    create: {
      id: 'seed-weekly-plan-approved-conn12',
      tenantId: TENANT_ID,
      locationId: locationApprovedId,
      weekStart: APPROVED_WEEK_START,
      status: WeeklyShiftPlanStatus.APPROVED,
      approvedAt: new Date('2026-07-10T15:00:00.000Z'),
    },
  });

  console.log(
    'CONN-12 WeeklyShiftPlan demo: DRAFT',
    DRAFT_WEEK_START.toISOString().slice(0, 10),
    '+ APPROVED',
    APPROVED_WEEK_START.toISOString().slice(0, 10),
    `(location ${locationDraftId})`,
  );
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const location = await prisma.location.findFirst({
      where: { tenantId: TENANT_ID, deletedAt: null, isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, code: true },
    });

    if (!location) {
      throw new Error(
        `No hay Location activa en tenant "${TENANT_ID}". Corre primero el seed completo (pnpm db:seed).`,
      );
    }

    await seedWeeklyShiftPlansDemo(prisma, location.id, location.id);
    console.log('OK — sede usada:', location.code ?? location.name, location.id);
  } finally {
    await prisma.$disconnect();
  }
}

const isDirectRun =
  typeof process.argv[1] === 'string' &&
  (process.argv[1].endsWith('conn12-weekly-shift-plans.seed.ts') ||
    process.argv[1].endsWith('conn12-weekly-shift-plans.seed.js'));

if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
