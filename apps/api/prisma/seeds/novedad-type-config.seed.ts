import { NovedadType, PrismaClient } from '@prisma/client';

/** Defaults MVP NOM-14 — configurables por tenant vía API. */
const NOVEDAD_TYPE_DEFAULTS: ReadonlyArray<{
  type: NovedadType;
  requiresSupervisorApproval: boolean;
  requiresSupportDocument: boolean;
  isPaidDefault: boolean;
}> = [
  {
    type: NovedadType.PERMISO_REMUNERADO,
    requiresSupervisorApproval: true,
    requiresSupportDocument: false,
    isPaidDefault: true,
  },
  {
    type: NovedadType.LICENCIA_NO_REMUNERADA,
    requiresSupervisorApproval: true,
    requiresSupportDocument: false,
    isPaidDefault: false,
  },
  {
    type: NovedadType.LICENCIA_LUTO,
    requiresSupervisorApproval: false,
    requiresSupportDocument: true,
    isPaidDefault: true,
  },
  {
    type: NovedadType.LICENCIA_PATERNIDAD,
    requiresSupervisorApproval: false,
    requiresSupportDocument: true,
    isPaidDefault: true,
  },
  {
    type: NovedadType.LICENCIA_MATERNIDAD,
    requiresSupervisorApproval: false,
    requiresSupportDocument: true,
    isPaidDefault: true,
  },
  {
    type: NovedadType.CALAMIDAD_DOMESTICA,
    requiresSupervisorApproval: false,
    requiresSupportDocument: true,
    isPaidDefault: true,
  },
  {
    type: NovedadType.DIA_FAMILIA,
    requiresSupervisorApproval: false,
    requiresSupportDocument: true,
    isPaidDefault: true,
  },
  {
    type: NovedadType.AUSENCIA_INJUSTIFICADA,
    requiresSupervisorApproval: false,
    requiresSupportDocument: false,
    isPaidDefault: false,
  },
];

export async function seedNovedadTypeConfigs(
  prisma: PrismaClient,
  tenantId: string,
): Promise<void> {
  for (const defaults of NOVEDAD_TYPE_DEFAULTS) {
    await prisma.novedadTypeConfig.upsert({
      where: {
        tenantId_type: {
          tenantId,
          type: defaults.type,
        },
      },
      update: {},
      create: {
        tenantId,
        ...defaults,
      },
    });
  }

  console.log(
    `✅ NovedadTypeConfig: ${NOVEDAD_TYPE_DEFAULTS.length} tipos para tenant ${tenantId}`,
  );
}
