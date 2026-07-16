/**
 * OS-595 — etiquetas exactas de la plantilla Aportes en Línea v1 (DatosPruebaEmp).
 * Clave = código UGPP/Minsalud (`pilaCode`). Sin fuzzy match: si falta → bloquear XLSX.
 *
 * Plantilla: `templates/aportes-en-linea-v1.xlsx` (copia de docs/PlantillaXLSX..xlsx).
 * Versión interna documentada: aportes-en-linea-v1 (2026-07-15).
 */

/** Código DIVIPOLA departamento → nombre exacto en lista RGDIVIDEPTO. */
export const PILA_XLSX_DEPARTMENT_BY_CODE: Readonly<Record<string, string>> = {
  '05': 'ANTIOQUIA',
  '08': 'ATLANTICO',
  '11': 'BOGOTA_D.E.',
  '13': 'BOLIVAR',
  '15': 'BOYACA',
  '17': 'CALDAS',
  '18': 'CAQUETA',
  '19': 'CAUCA',
  '20': 'CESAR',
  '23': 'CORDOBA',
  '25': 'CUNDINAMARCA',
  '27': 'CHOCO',
  '41': 'HUILA',
  '44': 'LA_GUAJIRA',
  '47': 'MAGDALENA',
  '50': 'META',
  '52': 'NARIÑO',
  '54': 'NORTE_DE_SANTANDER',
  '63': 'QUINDIO',
  '66': 'RISARALDA',
  '68': 'SANTANDER',
  '70': 'SUCRE',
  '73': 'TOLIMA',
  '76': 'VALLE',
  '81': 'ARAUCA',
  '85': 'CASANARE',
  '86': 'PUTUMAYO',
  '88': 'SAN_ANDRES',
  '91': 'AMAZONAS',
  '94': 'GUAINIA',
  '95': 'GUAVIARE',
  '97': 'VAUPES',
  '99': 'VICHADA',
};

/** Código administradora → etiqueta exacta de lista plantilla. */
export const PILA_XLSX_AFP_BY_CODE: Readonly<Record<string, string>> = {
  '25-14': 'COLPENSIONES',
  '230301': 'PORVENIR',
  '230201': 'PROTECCION',
  '231001': 'COLFONDOS',
  '230901': 'SKANDIA',
};

export const PILA_XLSX_EPS_BY_CODE: Readonly<Record<string, string>> = {
  EPS001: 'ALIANSALUD EPS (ANTES COLMEDICA)',
  EPS002: 'SALUD TOTAL',
  EPS005: 'SANITAS',
  EPS008: 'COMPENSAR',
  EPS010: 'EPS SURA (ANTES SUSALUD)',
  EPS012: 'COMFENALCO VALLE',
  EPS017: 'FAMISANAR',
  EPS018: 'S.O.S. SERVICIO OCCIDENTAL DE SALUD S.A.',
  EPS037: 'NUEVA E.P.S.',
  EPS040: 'SAVIA SALUD ',
  EPS046: 'SALUD MIA EPS',
  ESSC07: 'MUTUAL SER',
  ESSC18: 'EMSSANAR',
  ESSC24: 'COOSALUD EPS',
  ESSC62: 'ASMET SALUD EPS SAS',
  EPSC25: 'CAPRESOCA',
  EPSC34: 'CAPITAL SALUD',
  CCFC20: 'COMFACHOCÓ',
  CCFC50: 'COMFAORIENTE',
  CCFC55: 'CAJACOPI',
  EPSIC4: 'ANAS WAYUU',
  EPSIC5: 'MALLAMAS',
  EPSIC6: 'PIJAOSALUD',
};

export const PILA_XLSX_ARL_BY_CODE: Readonly<Record<string, string>> = {
  '14-11': 'ARL SURA',
  '14-23': 'POSITIVA COMPAÑIA DE SEGUROS',
  '14-25': 'COLMENA',
  '14-7': 'SEGUROS BOLIVAR',
  '14-4': 'COLPATRIA ARP',
  '14-29': 'LA EQUIDAD SEGUROS',
  '14-17': 'ALFA',
  '14-30': 'MAPFRE COLOMBIA VIDA SEGUROS S.A.',
  '14-18': 'LIBERTY',
  '14-8': 'SEGUROS DE VIDA AURORA',
};

export const PILA_XLSX_CCF_BY_CODE: Readonly<Record<string, string>> = {
  CCF22: 'COLSUBSIDIO',
  CCF21: 'CAFAM',
  CCF24: 'COMPENSAR',
  CCF04: 'COMFAMA',
  CCF06: 'COMBARRANQUILLA',
  CCF10: 'COMFABOY',
  CCF02: 'COMFAMILIAR CAMACOL',
  CCF03: 'COMFENALCO ANTIOQUIA',
  CCF08: 'COMFENALCO CARTAGENA',
  CCF40: 'COMFENALCO SANTANDER',
  CCF50: 'COMFENALCO TOLIMA',
  CCF57: 'COMFANDI',
  CCF34: 'COFREM',
  CCF05: 'CAJACOPI ATLANTICO',
  CCF07: 'COMFAMILIAR ATLANTICO',
  CCF13: 'COMFACA',
  CCF14: 'COMFACAUCA',
  CCF15: 'COMFACESAR',
  CCF16: 'COMFACOR',
  CCF26: 'COMFACUNDI',
  CCF29: 'COMFACHOCÓ',
  CCF30: 'COMFAMILIAR GUAJIRA',
  CCF32: 'COMFAMILIAR HUILA',
  CCF33: 'CAJAMAG',
  CCF35: 'COMFAMILIAR NARIÑO',
  CCF36: 'COMFAORIENTE',
  CCF37: 'COMFANORTE',
  CCF39: 'CAJASAN',
  CCF41: 'COMFASUCRE',
  CCF43: 'COMFENALCO QUINDIO',
  CCF44: 'COMFAMILIAR RISARALDA',
  CCF46: 'CAFASUR',
  CCF48: 'COMFATOLIMA',
  CCF63: 'COMFAMILIAR PUTUMAYO',
  CCF64: 'CAJASAI',
  CCF65: 'CAFAMAZ',
  CCF67: 'COMFIAR',
  CCF68: 'COMCAJA',
  CCF69: 'COMFACASANARE',
};

export const PILA_XLSX_PLANILLA_E_LABEL = 'E - Planilla Empleados Empresas';
export const PILA_XLSX_APORTANTE_EMPLEADOR = 'EMPLEADOR';
export const PILA_XLSX_COTIZANTE_01_LABEL = '1. DEPENDIENTE';
export const PILA_XLSX_SUBTIPO_NINGUNO = 'NINGUNO';
export const PILA_XLSX_SI = 'SI';
export const PILA_XLSX_NO = 'NO';
export const PILA_XLSX_CORRECCIONES_NO = 'NO';
export const PILA_XLSX_ALTO_RIESGO_SIN = 'SIN RIESGO';

export const PILA_XLSX_TEMPLATE_VERSION = 'aportes-en-linea-v1';
export const PILA_XLSX_TEMPLATE_FILE = 'aportes-en-linea-v1.xlsx';
export const PILA_XLSX_MAX_EMPLOYEES = 20;
export const PILA_XLSX_DATA_START_ROW = 19;
export const PILA_XLSX_SHEET_LIQUIDACIONES = 'Liquidaciones';
export const PILA_XLSX_SHEET_CATALOG = 'DatosPruebaEmp';

/**
 * Columnas de etiquetas en `DatosPruebaEmp` (fila ≥3).
 * Los mapas código→etiqueta siguen siendo necesarios: la hoja solo tiene nombres,
 * mientras TXT/UGPP usan códigos oficiales. La hoja se usa para validar membresía exacta.
 */
export const PILA_XLSX_CATALOG_COLUMNS = {
  afp: 7,
  eps: 8,
  ccf: 9,
  arl: 10,
  department: 28,
} as const;

export type PilaXlsxErrorDetails = {
  code: string;
  internalValue?: string;
  expectedHint?: string;
  employeeId?: string;
  employeeName?: string;
  actualCount?: number;
  maxAllowed?: number;
  recommendedAction?: string;
};

export class PilaXlsxSerializationError extends Error {
  constructor(
    readonly field: string,
    message: string,
    readonly details: PilaXlsxErrorDetails = { code: 'ERR_PILA_XLSX_SERIALIZE' },
  ) {
    super(message);
    this.name = 'PilaXlsxSerializationError';
  }
}

export function resolveXlsxLabel(
  map: Readonly<Record<string, string>>,
  code: string,
  field: string,
  context?: { employeeId?: string; employeeName?: string; catalogSample?: string[] },
): string {
  const label = map[code];
  if (!label) {
    const sample = context?.catalogSample?.slice(0, 8).join(', ');
    throw new PilaXlsxSerializationError(
      field,
      `Código "${code}" sin etiqueta exacta en plantilla Aportes en Línea (sin fuzzy match).` +
        (sample ? ` Ejemplos de catálogo: ${sample}.` : '') +
        ' Corrige el pilaCode del maestro o usa archivo plano TXT.',
      {
        code: 'ERR_PILA_XLSX_CATALOG_MISMATCH',
        internalValue: code,
        expectedHint: sample ?? 'etiqueta exacta de DatosPruebaEmp',
        employeeId: context?.employeeId,
        employeeName: context?.employeeName,
        recommendedAction:
          'Actualiza el código PILA del empleado/sede a uno mapeado, o genera TXT (Anexo 2).',
      },
    );
  }
  return label;
}
