import { PrismaClient } from '@prisma/client';

/**
 * OS-595 — TenantPilaConfig del tenant demo.
 *
 * `DEMO_PILA_ACTIVIDAD_ECONOMICA_ARL` (`5611001`) es un **fixture de desarrollo**
 * para ejercitar el flujo PILA (planilla E). NO es una actividad económica
 * certificada del tenant ni un valor oficial del Decreto 768/2022.
 * Producción debe configurar el código ARL real de su centro de trabajo.
 *
 * `DEMO_PILA_ARL_CODE` sí corresponde a ARL Sura en el listado UGPP sembrado.
 */
export const DEMO_PILA_ACTIVIDAD_ECONOMICA_ARL = '5611001';
export const DEMO_PILA_ARL_CODE = '14-11'; // ARL Sura — UGPP Listado códigos PILA

export async function seedTenantPilaConfig(prisma: PrismaClient, tenantId: string): Promise<void> {
  await prisma.tenantPilaConfig.upsert({
    where: { tenantId },
    update: {
      documentType: 'NI',
      claseAportante: 'B',
      naturalezaJuridica: '2',
      formaPresentacion: 'U',
      tipoAportante: '01',
      arlCode: DEMO_PILA_ARL_CODE,
      actividadEconomicaArl: DEMO_PILA_ACTIVIDAD_ECONOMICA_ARL,
      exemptFromHealthSenaIcbfLey1607: false,
    },
    create: {
      id: `seed-tenant-pila-config-${tenantId}`,
      tenantId,
      documentType: 'NI',
      claseAportante: 'B',
      naturalezaJuridica: '2',
      formaPresentacion: 'U',
      tipoAportante: '01',
      arlCode: DEMO_PILA_ARL_CODE,
      actividadEconomicaArl: DEMO_PILA_ACTIVIDAD_ECONOMICA_ARL,
      exemptFromHealthSenaIcbfLey1607: false,
    },
  });

  console.log(
    `TenantPilaConfig: upserted for tenant ${tenantId}` +
      ` (arlCode=${DEMO_PILA_ARL_CODE}, actividadEconomicaArl=${DEMO_PILA_ACTIVIDAD_ECONOMICA_ARL} demo fixture)`,
  );
}
