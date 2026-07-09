export const LABOR_LEGAL_PARAMETER_KEYS = [
  'SMLV',
  'AUXILIO_TRANSPORTE',
  'RECARGO_DOMINICAL_FESTIVO',
  'RECARGO_NOCTURNO',
  'JORNADA_MAX_SEMANAL',
  'HORARIO_NOCTURNO_INICIO',
  'INTERES_CESANTIAS',
  'UVT',
] as const;

export type LaborLegalParameterKey = (typeof LABOR_LEGAL_PARAMETER_KEYS)[number];

export const LABOR_LEGAL_PARAMETER_KEY_LABELS: Record<LaborLegalParameterKey, string> = {
  SMLV: 'Salario mínimo (SMLV)',
  AUXILIO_TRANSPORTE: 'Auxilio de transporte',
  RECARGO_DOMINICAL_FESTIVO: 'Recargo dominical/festivo',
  RECARGO_NOCTURNO: 'Recargo nocturno',
  JORNADA_MAX_SEMANAL: 'Jornada máxima semanal (horas)',
  HORARIO_NOCTURNO_INICIO: 'Inicio horario nocturno (hora 0-23)',
  INTERES_CESANTIAS: 'Interés a las cesantías (anual)',
  UVT: 'Unidad de Valor Tributario (UVT)',
};

export interface LaborLegalParameter {
  id: string;
  tenantId: string | null;
  key: string;
  value: number;
  validFrom: string;
  validTo: string | null;
  source: string | null;
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateLaborLegalParameterFormValues {
  key: string;
  value: number;
  validFrom: string;
  validTo?: string;
  source?: string;
  /** Omit for a global (platform-wide) parameter — SUPER_ADMIN only. */
  tenantId?: string;
}

export interface UpdateLaborLegalParameterFormValues {
  value?: number;
  validFrom?: string;
  validTo?: string | null;
  source?: string;
}
