import { PrismaClient } from '@prisma/client';

const TENANT_ID = 'palos-de-lena';

/**
 * OS-550 follow-up — Organigrama de supervisión por cargo (fuente: Excel
 * `Organigrama_Palos_de_Lena_Supervision.xlsx`, hoja "Organigrama Palos de Leña").
 *
 * Cargos que no existían en EMPLOYEE_POSITIONS_PDL (seed.ts) — se agregan aquí para no
 * mezclar el catálogo operativo (línea/servicio) con los niveles directivos del organigrama.
 * IDs continúan la secuencia `pos-pdl-039..046` (el catálogo principal llega hasta 038).
 */
const NEW_ORG_CHART_POSITIONS = [
  { id: 'pos-pdl-039', title: 'FUNDADORES', area: 'Gerencia', baseSalaryRange: 20000000 },
  { id: 'pos-pdl-040', title: 'REVISORÍA FISCAL', area: 'Gerencia', baseSalaryRange: 4000000 },
  {
    id: 'pos-pdl-041',
    title: 'DIRECTOR JURÍDICO - EXTERNO',
    area: 'Gerencia',
    baseSalaryRange: 5000000,
  },
  {
    id: 'pos-pdl-042',
    title: 'DIRECTOR ADMINISTRATIVO - FINANCIERO',
    area: 'Gerencia',
    baseSalaryRange: 8000000,
  },
  { id: 'pos-pdl-043', title: 'COORDINADOR DE PLANTA', area: 'Planta', baseSalaryRange: 4500000 },
  { id: 'pos-pdl-044', title: 'COCINA PLANTA', area: 'Planta', baseSalaryRange: 1800000 },
  {
    id: 'pos-pdl-045',
    title: 'ANALISTA TALENTO HUMANO',
    area: 'Administrativo',
    baseSalaryRange: 3000000,
  },
  { id: 'pos-pdl-046', title: 'SST EXTERNO', area: 'Administrativo', baseSalaryRange: 3000000 },
] as const;

/**
 * Mapea el nombre de Cargo tal como aparece en el Excel al `id` del `EmployeePosition`
 * correspondiente — ya sea uno de los 38 cargos operativos existentes (EMPLOYEE_POSITIONS_PDL,
 * seed.ts) o uno de los 8 nuevos de arriba. Resuelve alias donde el texto del Excel no
 * coincide literalmente con el título ya sembrado:
 *
 *   - "Chef Corporativo"       → CHEF COORPORATIVO (typo ya existente en el catálogo)
 *   - "Gerente PDV/Administrador" → GERENTE DE PUNTO DE VENTA (PDV = Punto De Venta)
 *   - "Administrador Jr"       → ADMINISTRADOR JUNIOR
 *   - "Impulsadores"/"Asesores de Venta"/"Parrilleros" → singular ya sembrado
 *   - "Parrilla Jr"            → PARRILLERO JUNIOR
 *   - "Director Comercial y Mercadeo" → DIRECTORA COMERCIAL
 *   - "Líder de Producción"    → LIDER DE PLANTA DE PRODUCCION (el Excel omite "planta")
 *   - "Aux. Conductor"         → AUXILIAR DE CONDUCCION
 *   - "Jefe/Analista de Abastecimiento" → JEFE/ANALISTA DE COMPRAS — confirmado con
 *     producto: mismo cargo, nombre distinto (no crear "Abastecimiento" como cargo nuevo).
 *   - "Líder de Talento Humano" → JEFE DE TALENO HUMANO (typo ya existente) — confirmado
 *     con producto: mismo cargo, no crear "Líder de Talento Humano" como cargo nuevo.
 */
const ORG_CHART_POSITION_IDS: Record<string, string> = {
  Fundadores: 'pos-pdl-039',
  'Gerente General': 'pos-pdl-007',
  'Revisoría Fiscal': 'pos-pdl-040',
  'Director Jurídico - Externo': 'pos-pdl-041',
  'Director de Operaciones': 'pos-pdl-003',
  'Director Administrativo - Financiero': 'pos-pdl-042',
  'Líder de Talento Humano': 'pos-pdl-032', // alias → JEFE DE TALENO HUMANO
  'Director Comercial y Mercadeo': 'pos-pdl-004', // alias → DIRECTORA COMERCIAL
  'Chef Corporativo': 'pos-pdl-010', // alias → CHEF COORPORATIVO
  'Gerente PDV/Administrador': 'pos-pdl-006', // alias → GERENTE DE PUNTO DE VENTA
  'Administrador Jr': 'pos-pdl-002', // alias → ADMINISTRADOR JUNIOR
  Cocina: 'pos-pdl-011',
  Impulsadores: 'pos-pdl-020', // alias → IMPULSADOR
  'Asesores de Venta': 'pos-pdl-015', // alias → ASESOR DE VENTAS
  Parrilleros: 'pos-pdl-013', // alias → PARRILLERO
  'Parrilla Jr': 'pos-pdl-014', // alias → PARRILLERO JUNIOR
  'Jefe de Abastecimiento': 'pos-pdl-031', // alias → JEFE DE COMPRAS
  'Analista de Abastecimiento': 'pos-pdl-023', // alias → ANALISTA DE COMPRAS
  'Analista Financiera y Contable': 'pos-pdl-025',
  'Aprendiz SENA': 'pos-pdl-026',
  'Coordinador de Planta': 'pos-pdl-043',
  'Líder de Producción': 'pos-pdl-022', // alias → LIDER DE PLANTA DE PRODUCCION
  Almacenista: 'pos-pdl-035',
  'Cocina Planta': 'pos-pdl-044',
  Conductor: 'pos-pdl-038',
  'Aux. Conductor': 'pos-pdl-036', // alias → AUXILIAR DE CONDUCCION
  'Analista Talento Humano': 'pos-pdl-045',
  'SST Externo': 'pos-pdl-046',
  'Auxiliar Talento Humano': 'pos-pdl-029',
  'Servicios Generales': 'pos-pdl-034',
  Programador: 'pos-pdl-033',
  'Ejecutivo Comercial': 'pos-pdl-018',
};

/**
 * Relaciones Cargo → Cargo supervisor, tal como están en el Excel. `Fundadores` es la raíz
 * (máxima autoridad, no reporta a nadie) — sin fila de edge. Las anotaciones del Excel
 * ("línea de asesoría externa") son informativas; el modelo no distingue jerárquico vs.
 * asesoría, solo registra el vínculo Cargo → Cargo supervisor.
 */
const ORG_CHART_EDGES: ReadonlyArray<{ cargo: string; supervisorCargo: string }> = [
  { cargo: 'Gerente General', supervisorCargo: 'Fundadores' },
  { cargo: 'Revisoría Fiscal', supervisorCargo: 'Gerente General' },
  { cargo: 'Director Jurídico - Externo', supervisorCargo: 'Gerente General' },
  { cargo: 'Director de Operaciones', supervisorCargo: 'Gerente General' },
  { cargo: 'Director Administrativo - Financiero', supervisorCargo: 'Gerente General' },
  { cargo: 'Líder de Talento Humano', supervisorCargo: 'Gerente General' },
  { cargo: 'Director Comercial y Mercadeo', supervisorCargo: 'Gerente General' },
  { cargo: 'Chef Corporativo', supervisorCargo: 'Gerente General' },
  { cargo: 'Gerente PDV/Administrador', supervisorCargo: 'Director de Operaciones' },
  { cargo: 'Administrador Jr', supervisorCargo: 'Gerente PDV/Administrador' },
  { cargo: 'Cocina', supervisorCargo: 'Administrador Jr' },
  { cargo: 'Impulsadores', supervisorCargo: 'Administrador Jr' },
  { cargo: 'Asesores de Venta', supervisorCargo: 'Administrador Jr' },
  { cargo: 'Parrilleros', supervisorCargo: 'Chef Corporativo' },
  { cargo: 'Parrilla Jr', supervisorCargo: 'Parrilleros' },
  { cargo: 'Jefe de Abastecimiento', supervisorCargo: 'Director Administrativo - Financiero' },
  { cargo: 'Analista de Abastecimiento', supervisorCargo: 'Jefe de Abastecimiento' },
  { cargo: 'Analista Financiera y Contable', supervisorCargo: 'Jefe de Abastecimiento' },
  { cargo: 'Aprendiz SENA', supervisorCargo: 'Analista Financiera y Contable' },
  { cargo: 'Coordinador de Planta', supervisorCargo: 'Director Administrativo - Financiero' },
  { cargo: 'Líder de Producción', supervisorCargo: 'Coordinador de Planta' },
  { cargo: 'Almacenista', supervisorCargo: 'Líder de Producción' },
  { cargo: 'Cocina Planta', supervisorCargo: 'Líder de Producción' },
  { cargo: 'Conductor', supervisorCargo: 'Coordinador de Planta' },
  { cargo: 'Aux. Conductor', supervisorCargo: 'Conductor' },
  { cargo: 'Analista Talento Humano', supervisorCargo: 'Líder de Talento Humano' },
  { cargo: 'SST Externo', supervisorCargo: 'Analista Talento Humano' },
  { cargo: 'Auxiliar Talento Humano', supervisorCargo: 'Analista Talento Humano' },
  { cargo: 'Servicios Generales', supervisorCargo: 'Auxiliar Talento Humano' },
  { cargo: 'Programador', supervisorCargo: 'Director Comercial y Mercadeo' },
  { cargo: 'Ejecutivo Comercial', supervisorCargo: 'Director Comercial y Mercadeo' },
];

function padded(id: number): string {
  return id.toString().padStart(12, '0');
}

/**
 * Cargos nuevos del organigrama + relaciones Cargo → Cargo supervisor (EmployeePositionSupervisor).
 * Idempotente: cargos por upsert-por-id (mismo criterio que seedEmployeePositions — el título
 * puede normalizarse fuera del seed, el id es la identidad estable); relaciones por upsert
 * con `where` en la unique compuesta `tenantId_positionId_supervisorPositionId`.
 */
export async function seedEmployeeOrgChart(prisma: PrismaClient): Promise<void> {
  for (const pos of NEW_ORG_CHART_POSITIONS) {
    await prisma.employeePosition.upsert({
      where: { id: pos.id },
      update: {
        title: pos.title,
        area: pos.area,
        baseSalaryRange: pos.baseSalaryRange,
        isActive: true,
      },
      create: {
        id: pos.id,
        tenantId: TENANT_ID,
        title: pos.title,
        area: pos.area,
        baseSalaryRange: pos.baseSalaryRange,
        isActive: true,
      },
    });
  }
  console.log(`EmployeePositions (organigrama): ${NEW_ORG_CHART_POSITIONS.length} cargos nuevos`);

  const referencedIds = new Set(Object.values(ORG_CHART_POSITION_IDS));
  const existingPositions = await prisma.employeePosition.findMany({
    where: { tenantId: TENANT_ID, id: { in: [...referencedIds] } },
    select: { id: true },
  });
  const existingIds = new Set(existingPositions.map((p) => p.id));
  const missingIds = [...referencedIds].filter((id) => !existingIds.has(id));
  if (missingIds.length > 0) {
    console.warn(
      `Org chart seed: positions missing (run seedEmployeePositions first) — skipping. ids=${missingIds.join(', ')}`,
    );
    return;
  }

  let created = 0;
  for (let i = 0; i < ORG_CHART_EDGES.length; i++) {
    const edge = ORG_CHART_EDGES[i]!;
    const positionId = ORG_CHART_POSITION_IDS[edge.cargo];
    const supervisorPositionId = ORG_CHART_POSITION_IDS[edge.supervisorCargo];
    if (!positionId || !supervisorPositionId) {
      throw new Error(
        `Org chart seed: no position id mapped for cargo="${edge.cargo}" or supervisorCargo="${edge.supervisorCargo}"`,
      );
    }

    await prisma.employeePositionSupervisor.upsert({
      where: {
        tenantId_positionId_supervisorPositionId: {
          tenantId: TENANT_ID,
          positionId,
          supervisorPositionId,
        },
      },
      update: {},
      create: {
        id: `66666666-0000-0000-0000-${padded(i + 1)}`,
        tenantId: TENANT_ID,
        positionId,
        supervisorPositionId,
      },
    });
    created++;
  }

  console.log(
    `✅ Org chart seed: ${created} relaciones Cargo → Cargo supervisor (${NEW_ORG_CHART_POSITIONS.length} cargos nuevos).`,
  );
}
