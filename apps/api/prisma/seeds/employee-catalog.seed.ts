import { EmployeeCatalogType, PrismaClient } from '@prisma/client';

import { employeeCatalogOptionClient } from './employee-catalog-prisma';

type CatalogSeed = {
  type: EmployeeCatalogType;
  names: string[];
};

/** 28 EPS autorizadas (Ministerio de Salud, corte junio 2025). */
const EPS_NAMES = [
  'Coosalud EPS-S',
  'Nueva EPS',
  'Mutual SER',
  'Salud Mía',
  'Aliansalud EPS',
  'Salud Total EPS',
  'EPS Sanitas',
  'EPS Sura',
  'Famisanar',
  'Servicio Occidental de Salud EPS (SOS)',
  'Comfenalco Valle',
  'Compensar EPS',
  'Empresas Públicas de Medellín (EPM)',
  'Fondo de Pasivo Social de Ferrocarriles Nacionales de Colombia',
  'Cajacopi Atlántico',
  'Capresoca',
  'Comfachocó',
  'Comfaoriente',
  'EPS Familiar de Colombia',
  'Asmet Salud',
  'Emssanar E.S.S.',
  'Capital Salud EPS',
  'Savia Salud EPS',
  'Dusakawi EPSI',
  'Asociación Indígena del Cauca EPSI',
  'Anas Wayuu EPSI',
  'Mallamas EPSI',
  'Pijaos Salud EPSI',
] as const;

/** 10 ARL autorizadas a nivel nacional (Fasecolda / Superfinanciera). */
const ARL_NAMES = [
  'ARL Sura',
  'Positiva Compañía de Seguros',
  'Colmena Seguros',
  'Seguros Bolívar',
  'Axa Colpatria',
  'La Equidad Seguros',
  'Seguros de Vida Alfa',
  'Mapfre Seguros',
  'Liberty Seguros',
  'Seguros de Vida Aurora',
] as const;

/** Régimen público (Prima Media) + administradoras privadas (Ahorro Individual). */
const PENSION_FUND_NAMES = [
  'Colpensiones',
  'Porvenir',
  'Protección',
  'Colfondos',
  'Skandia',
] as const;

const CESANTIAS_FUND_NAMES = [
  'Fondo Nacional del Ahorro',
  'Porvenir',
  'Protección',
  'Colfondos',
  'Skandia',
] as const;

/** 43 Cajas de Compensación Familiar (Superintendencia de Subsidio Familiar). */
const CAJA_COMPENSACION_NAMES = [
  'Colsubsidio',
  'Comfamiliar Camacol',
  'Comfama',
  'Combarranquilla',
  'Comfaboy',
  'Comfenalco Cartagena',
  'Comfenalco Tolima',
  'Comfaguajira',
  'Comfamiliar Risaralda',
  'Comfaca',
  'Cafam',
  'Cajacopi Atlántico',
  'Cofrem',
  'Comfamiliar Atlántico',
  'Comfenalco Antioquia',
  'Comfenalco Santander',
  'Compensar',
  'Confa',
  'Comcaja',
  'Comfiar',
  'Comfacasanare',
  'Comfacauca',
  'Comfacesar',
  'Comfachocó',
  'Comfamiliar Huila',
  'Cajamag',
  'Comfanorte',
  'Comfaoriente',
  'Comfamiliar Putumayo',
  'Comfasur',
  'Comfatolima',
  'Comfenalco Valle del Agente',
  'Comfandi',
  'Cajasan',
  'Comfasucre',
  'Comfenalco Quindío',
  'Cajasai',
  'Cafamaz',
  'Comfacor',
  'Comfacundi',
  'Comfamiliar Cartagena',
  'Comfamiliar Nariño',
  'Comfamiliar Neiva',
] as const;

const AREA_NAMES = [
  'Administración',
  'Operaciones',
  'Cocina',
  'Servicio',
  'Logística',
  'Producción',
] as const;

const DEPARTMENT_NAMES = [
  'Gerencia',
  'Recursos Humanos',
  'Contabilidad',
  'Producción',
  'Calidad',
  'Mantenimiento',
] as const;

const CATALOG_SEEDS: CatalogSeed[] = [
  { type: EmployeeCatalogType.EPS, names: [...EPS_NAMES] },
  { type: EmployeeCatalogType.ARL, names: [...ARL_NAMES] },
  { type: EmployeeCatalogType.PENSION_FUND, names: [...PENSION_FUND_NAMES] },
  { type: EmployeeCatalogType.CESANTIAS_FUND, names: [...CESANTIAS_FUND_NAMES] },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, names: [...CAJA_COMPENSACION_NAMES] },
  { type: EmployeeCatalogType.AREA, names: [...AREA_NAMES] },
  { type: EmployeeCatalogType.DEPARTMENT, names: [...DEPARTMENT_NAMES] },
];

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

  for (const group of CATALOG_SEEDS) {
    for (const name of group.names) {
      const id = catalogOptionId(tenantId, group.type, name);
      activeIds.add(id);
      await catalog.upsert({
        where: { id },
        update: { name, isActive: true, type: group.type },
        create: {
          id,
          tenantId,
          type: group.type,
          name,
          isActive: true,
        },
      });
    }
  }

  const catalogTypes = CATALOG_SEEDS.map((group) => group.type);
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

  console.log(`EmployeeCatalogOptions: seeded ${total} active options for tenant ${tenantId}`);
}
