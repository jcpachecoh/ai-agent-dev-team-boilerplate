/**
 * OS-595 — códigos PILA de administradoras para seeds.
 *
 * Fuente primaria:
 *   UGPP — «LISTADO DE CÓDIGOS PILA DE ADMINISTRADORAS DEL SISTEMA DE LA PROTECCIÓN SOCIAL»
 *   - https://www.ugpp.gov.co/wp-content/uploads/2025/01/bd_codigos_pila_2024.pdf
 *   - https://www.ugpp.gov.co/sites/default/files/Parafiscales/Listado-Codigos-PILA.pdf
 * Complemento EPS vigentes (códigos de aseguramiento, junio 2025):
 *   Minsalud — listado EPS por régimen (05-jun-2025)
 *
 * Política: solo se asigna `pilaCode` cuando hay correspondencia explícita
 * nombre-seed ↔ fila UGPP/Minsalud. Sin fuzzy match. Si no hay certeza → null.
 */

import { EmployeeCatalogType } from '@prisma/client';

export type CatalogSeedRow = {
  type: EmployeeCatalogType;
  name: string;
  /** Código oficial PILA; null = no poblado con seguridad */
  pilaCode: string | null;
};

/** Versión documentada de la fuente usada por este seed. */
export const PILA_ADMIN_CODES_SOURCE = {
  primary:
    'UGPP Listado códigos PILA administradoras (bd_codigos_pila_2024 / Listado-Codigos-PILA)',
  epsComplement: 'Minsalud listado EPS vigentes por régimen, 05-jun-2025',
  documentedAt: '2026-07-15',
  ticket: 'OS-595',
} as const;

export const PILA_CATALOG_SEED_ROWS: readonly CatalogSeedRow[] = [
  // ── EPS (nombres históricos del seed + código UGPP/Minsalud cuando hay match exacto) ──
  { type: EmployeeCatalogType.EPS, name: 'Coosalud EPS-S', pilaCode: 'ESSC24' },
  { type: EmployeeCatalogType.EPS, name: 'Nueva EPS', pilaCode: 'EPS037' },
  { type: EmployeeCatalogType.EPS, name: 'Mutual SER', pilaCode: 'ESSC07' },
  { type: EmployeeCatalogType.EPS, name: 'Salud Mía', pilaCode: 'EPS046' },
  { type: EmployeeCatalogType.EPS, name: 'Aliansalud EPS', pilaCode: 'EPS001' },
  { type: EmployeeCatalogType.EPS, name: 'Salud Total EPS', pilaCode: 'EPS002' },
  { type: EmployeeCatalogType.EPS, name: 'EPS Sanitas', pilaCode: 'EPS005' },
  { type: EmployeeCatalogType.EPS, name: 'EPS Sura', pilaCode: 'EPS010' },
  { type: EmployeeCatalogType.EPS, name: 'Famisanar', pilaCode: 'EPS017' },
  {
    type: EmployeeCatalogType.EPS,
    name: 'Servicio Occidental de Salud EPS (SOS)',
    pilaCode: 'EPS018',
  },
  { type: EmployeeCatalogType.EPS, name: 'Comfenalco Valle', pilaCode: 'EPS012' },
  { type: EmployeeCatalogType.EPS, name: 'Compensar EPS', pilaCode: 'EPS008' },
  // Minsalud: EAS016 — no figura con ese código en el extracto UGPP revisado; se deja null.
  {
    type: EmployeeCatalogType.EPS,
    name: 'Empresas Públicas de Medellín (EPM)',
    pilaCode: null,
  },
  {
    type: EmployeeCatalogType.EPS,
    name: 'Fondo de Pasivo Social de Ferrocarriles Nacionales de Colombia',
    pilaCode: null,
  },
  { type: EmployeeCatalogType.EPS, name: 'Cajacopi Atlántico', pilaCode: 'CCFC55' },
  { type: EmployeeCatalogType.EPS, name: 'Capresoca', pilaCode: 'EPSC25' },
  { type: EmployeeCatalogType.EPS, name: 'Comfachocó', pilaCode: 'CCFC20' },
  { type: EmployeeCatalogType.EPS, name: 'Comfaoriente', pilaCode: 'CCFC50' },
  { type: EmployeeCatalogType.EPS, name: 'EPS Familiar de Colombia', pilaCode: 'CCFC33' },
  { type: EmployeeCatalogType.EPS, name: 'Asmet Salud', pilaCode: 'ESSC62' },
  { type: EmployeeCatalogType.EPS, name: 'Emssanar E.S.S.', pilaCode: 'ESSC18' },
  { type: EmployeeCatalogType.EPS, name: 'Capital Salud EPS', pilaCode: 'EPSC34' },
  { type: EmployeeCatalogType.EPS, name: 'Savia Salud EPS', pilaCode: 'EPS040' },
  { type: EmployeeCatalogType.EPS, name: 'Dusakawi EPSI', pilaCode: 'EPSIC1' },
  {
    type: EmployeeCatalogType.EPS,
    name: 'Asociación Indígena del Cauca EPSI',
    pilaCode: 'EPSIC3',
  },
  { type: EmployeeCatalogType.EPS, name: 'Anas Wayuu EPSI', pilaCode: 'EPSIC4' },
  { type: EmployeeCatalogType.EPS, name: 'Mallamas EPSI', pilaCode: 'EPSIC5' },
  { type: EmployeeCatalogType.EPS, name: 'Pijaos Salud EPSI', pilaCode: 'EPSIC6' },

  // ── ARL (UGPP) ──
  { type: EmployeeCatalogType.ARL, name: 'ARL Sura', pilaCode: '14-11' },
  { type: EmployeeCatalogType.ARL, name: 'Positiva Compañía de Seguros', pilaCode: '14-23' },
  { type: EmployeeCatalogType.ARL, name: 'Colmena Seguros', pilaCode: '14-25' },
  { type: EmployeeCatalogType.ARL, name: 'Seguros Bolívar', pilaCode: '14-7' },
  { type: EmployeeCatalogType.ARL, name: 'Axa Colpatria', pilaCode: '14-4' },
  { type: EmployeeCatalogType.ARL, name: 'La Equidad Seguros', pilaCode: '14-29' },
  { type: EmployeeCatalogType.ARL, name: 'Seguros de Vida Alfa', pilaCode: '14-17' },
  { type: EmployeeCatalogType.ARL, name: 'Mapfre Seguros', pilaCode: '14-30' },
  { type: EmployeeCatalogType.ARL, name: 'Liberty Seguros', pilaCode: '14-18' },
  { type: EmployeeCatalogType.ARL, name: 'Seguros de Vida Aurora', pilaCode: '14-8' },

  // ── AFP / pensión (UGPP) ──
  { type: EmployeeCatalogType.PENSION_FUND, name: 'Colpensiones', pilaCode: '25-14' },
  { type: EmployeeCatalogType.PENSION_FUND, name: 'Porvenir', pilaCode: '230301' },
  { type: EmployeeCatalogType.PENSION_FUND, name: 'Protección', pilaCode: '230201' },
  { type: EmployeeCatalogType.PENSION_FUND, name: 'Colfondos', pilaCode: '231001' },
  { type: EmployeeCatalogType.PENSION_FUND, name: 'Skandia', pilaCode: '230901' },

  // ── Cesantías: no requieren código PILA de cotizante activo en v1 ──
  { type: EmployeeCatalogType.CESANTIAS_FUND, name: 'Fondo Nacional del Ahorro', pilaCode: null },
  { type: EmployeeCatalogType.CESANTIAS_FUND, name: 'Porvenir', pilaCode: null },
  { type: EmployeeCatalogType.CESANTIAS_FUND, name: 'Protección', pilaCode: null },
  { type: EmployeeCatalogType.CESANTIAS_FUND, name: 'Colfondos', pilaCode: null },
  { type: EmployeeCatalogType.CESANTIAS_FUND, name: 'Skandia', pilaCode: null },

  // ── CCF (UGPP) — solo filas con match de nombre inequívoco ──
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Colsubsidio', pilaCode: 'CCF22' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfamiliar Camacol', pilaCode: 'CCF02' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfama', pilaCode: 'CCF04' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Combarranquilla', pilaCode: 'CCF06' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfaboy', pilaCode: 'CCF10' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfenalco Cartagena', pilaCode: 'CCF08' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfenalco Tolima', pilaCode: 'CCF50' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfaguajira', pilaCode: 'CCF30' },
  {
    type: EmployeeCatalogType.CAJA_COMPENSACION,
    name: 'Comfamiliar Risaralda',
    pilaCode: 'CCF44',
  },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfaca', pilaCode: 'CCF13' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Cafam', pilaCode: 'CCF21' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Cajacopi Atlántico', pilaCode: 'CCF05' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Cofrem', pilaCode: 'CCF34' },
  {
    type: EmployeeCatalogType.CAJA_COMPENSACION,
    name: 'Comfamiliar Atlántico',
    pilaCode: 'CCF07',
  },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfenalco Antioquia', pilaCode: 'CCF03' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfenalco Santander', pilaCode: 'CCF40' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Compensar', pilaCode: 'CCF24' },
  // "Confa" es ambiguo (varias cajas regionales) — sin código
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Confa', pilaCode: null },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comcaja', pilaCode: 'CCF68' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfiar', pilaCode: 'CCF67' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfacasanare', pilaCode: 'CCF69' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfacauca', pilaCode: 'CCF14' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfacesar', pilaCode: 'CCF15' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfachocó', pilaCode: 'CCF29' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfamiliar Huila', pilaCode: 'CCF32' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Cajamag', pilaCode: 'CCF33' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfanorte', pilaCode: 'CCF37' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfaoriente', pilaCode: 'CCF36' },
  {
    type: EmployeeCatalogType.CAJA_COMPENSACION,
    name: 'Comfamiliar Putumayo',
    pilaCode: 'CCF63',
  },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfasur', pilaCode: 'CCF46' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfatolima', pilaCode: 'CCF48' },
  // Nombre seed "Comfenalco Valle del Agente" ≠ fila UGPP "COMFENALCO VALLE" — sin código
  {
    type: EmployeeCatalogType.CAJA_COMPENSACION,
    name: 'Comfenalco Valle del Agente',
    pilaCode: null,
  },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfandi', pilaCode: 'CCF57' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Cajasan', pilaCode: 'CCF39' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfasucre', pilaCode: 'CCF41' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfenalco Quindío', pilaCode: 'CCF43' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Cajasai', pilaCode: 'CCF64' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Cafamaz', pilaCode: 'CCF65' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfacor', pilaCode: 'CCF16' },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfacundi', pilaCode: 'CCF26' },
  // Ambiguo vs CCF09 CARTAGENA / otras — sin código
  {
    type: EmployeeCatalogType.CAJA_COMPENSACION,
    name: 'Comfamiliar Cartagena',
    pilaCode: null,
  },
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfamiliar Nariño', pilaCode: 'CCF35' },
  // "Comfamiliar Neiva" no tiene fila inequívoca distinta de Huila — sin código
  { type: EmployeeCatalogType.CAJA_COMPENSACION, name: 'Comfamiliar Neiva', pilaCode: null },

  // ── AREA / DEPARTMENT (sin código PILA) ──
  { type: EmployeeCatalogType.AREA, name: 'Administración', pilaCode: null },
  { type: EmployeeCatalogType.AREA, name: 'Operaciones', pilaCode: null },
  { type: EmployeeCatalogType.AREA, name: 'Cocina', pilaCode: null },
  { type: EmployeeCatalogType.AREA, name: 'Servicio', pilaCode: null },
  { type: EmployeeCatalogType.AREA, name: 'Logística', pilaCode: null },
  { type: EmployeeCatalogType.AREA, name: 'Producción', pilaCode: null },
  { type: EmployeeCatalogType.DEPARTMENT, name: 'Gerencia', pilaCode: null },
  { type: EmployeeCatalogType.DEPARTMENT, name: 'Recursos Humanos', pilaCode: null },
  { type: EmployeeCatalogType.DEPARTMENT, name: 'Contabilidad', pilaCode: null },
  { type: EmployeeCatalogType.DEPARTMENT, name: 'Producción', pilaCode: null },
  { type: EmployeeCatalogType.DEPARTMENT, name: 'Calidad', pilaCode: null },
  { type: EmployeeCatalogType.DEPARTMENT, name: 'Mantenimiento', pilaCode: null },
];
