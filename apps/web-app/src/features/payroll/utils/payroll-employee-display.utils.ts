import type {
  BeneficiaryRelationshipType,
  CostCenter,
  EmployeeContractType,
  LaborClassification,
  PayrollEmployee,
  SalaryType,
} from '../types/payroll.types';

const CONTRACT_LABELS: Record<EmployeeContractType, string> = {
  FIJO: 'Fijo',
  INDEFINIDO: 'Indefinido',
  OBRA: 'Obra o labor',
  PRESTACION: 'Prestación de servicios',
  APRENDIZAJE: 'Aprendizaje',
};

const SALARY_TYPE_LABELS: Record<SalaryType, string> = {
  ORDINARIO: 'Ordinario',
  INTEGRAL: 'Integral',
};

const COST_CENTER_LABELS: Record<CostCenter, string> = {
  ADMINISTRATIVO: 'Administrativo',
  OPERACIONES: 'Operaciones',
  PLANTA: 'Planta',
  GERENCIA: 'Gerencia',
  INCAPACIDADES: 'Incapacidades',
};

const LABOR_CLASSIFICATION_LABELS: Record<LaborClassification, string> = {
  COCINA: 'Cocina',
  SERVICIO: 'Servicio',
  ADMINISTRATIVO: 'Administrativo',
};

const BENEFICIARY_LABELS: Record<BeneficiaryRelationshipType, string> = {
  CHILD: 'Hijo',
  SPOUSE: 'Cónyuge',
  TUTOR: 'Tutor',
};

export function displayOrDash(value: string | null | undefined): string {
  if (!value || !value.trim()) return '—';
  return value.trim();
}

export function formatContractType(value: EmployeeContractType): string {
  return CONTRACT_LABELS[value] ?? value;
}

export function formatSalaryType(value: SalaryType): string {
  return SALARY_TYPE_LABELS[value] ?? value;
}

export function formatCostCenter(value: CostCenter | null | undefined): string {
  if (!value) return '—';
  return COST_CENTER_LABELS[value] ?? value;
}

export function formatLaborClassification(value: LaborClassification | null | undefined): string {
  if (!value) return '—';
  return LABOR_CLASSIFICATION_LABELS[value] ?? value;
}

export function formatBeneficiaryType(value: BeneficiaryRelationshipType): string {
  return BENEFICIARY_LABELS[value] ?? value;
}

export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-CO');
}

export function formatCurrencyCop(value: string | null | undefined): string {
  if (!value || !value.trim()) return '—';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export interface EmploymentDetailField {
  label: string;
  value: string;
  fullWidth?: boolean;
}

export function buildEmploymentDetailFields(
  employee: PayrollEmployee,
  roleName?: string,
): EmploymentDetailField[] {
  return [
    { label: 'Rol del sistema', value: displayOrDash(roleName) },
    { label: 'Centro de costos', value: formatCostCenter(employee.costCenter) },
    { label: 'Áreas', value: displayOrDash(employee.location?.name) },
    {
      label: 'Clasificación mano de obra',
      value: formatLaborClassification(employee.laborClassification),
    },
    { label: 'Cargo', value: displayOrDash(employee.position) },
    { label: 'Área', value: displayOrDash(employee.area) },
    { label: 'Departamento', value: displayOrDash(employee.department) },
    { label: 'Tipo de contrato', value: formatContractType(employee.contractType) },
    { label: 'Fecha de ingreso', value: formatDateOnly(employee.hireDate) },
    { label: 'Inicio de contrato', value: formatDateOnly(employee.contractStart) },
    { label: 'Fin de contrato', value: formatDateOnly(employee.contractEnd) },
    { label: 'Tipo de salario', value: formatSalaryType(employee.salaryType) },
    { label: 'Salario', value: formatCurrencyCop(employee.salaryAmount) },
    { label: 'No salariales (COP)', value: formatCurrencyCop(employee.nonSalaryAmount) },
  ];
}
