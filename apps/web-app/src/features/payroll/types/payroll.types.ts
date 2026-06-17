export type EmployeeContractType = 'FIJO' | 'INDEFINIDO' | 'OBRA' | 'PRESTACION' | 'APRENDIZAJE';

export type SalaryType = 'ORDINARIO' | 'INTEGRAL';

export type ArlRiskLevel = 'RIESGO_I' | 'RIESGO_II' | 'RIESGO_III' | 'RIESGO_IV' | 'RIESGO_V';

export type DocumentType = 'CC' | 'CE' | 'NIT' | 'PASSPORT';

export interface EmployeeUserSummary {
  email: string;
  cedula: string;
  documentType: string;
  roleId?: string;
}

export interface PayrollEmployee {
  id: string;
  userId: string;
  tenantId: string;
  name: string;
  locationId: string;
  position: string;
  area: string;
  department: string;
  contractType: EmployeeContractType;
  hireDate: string;
  contractStart: string;
  contractEnd?: string | null;
  salaryType: SalaryType;
  salaryAmount: string;
  hasTransportSubsidy: boolean;
  isExemptFromTax: boolean;
  epsName: string;
  pensionFundName: string;
  cesantiasFundName: string;
  arlName: string;
  arlRiskLevel: ArlRiskLevel;
  cajaCompensacion: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  user?: EmployeeUserSummary;
  location?: {
    id: string;
    name: string;
  };
}

export interface PayrollEmployeesFilters {
  locationId?: string;
  contractType?: EmployeeContractType;
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreatePayrollEmployeeInput {
  cedula: string;
  documentType: DocumentType;
  email: string;
  password: string;
  roleId: string;
  locationId: string;
  name: string;
  position: string;
  area: string;
  department: string;
  contractType: EmployeeContractType;
  hireDate: string;
  contractStart: string;
  contractEnd?: string;
  salaryType: SalaryType;
  salaryAmount: number;
  epsName: string;
  pensionFundName: string;
  cesantiasFundName: string;
  arlName: string;
  arlRiskLevel: ArlRiskLevel;
  cajaCompensacion: string;
}

export type UpdatePayrollEmployeeInput = Partial<CreatePayrollEmployeeInput> & {
  isActive?: boolean;
};

export interface PayrollEmployeeFormValues {
  cedula: string;
  documentType: DocumentType;
  email: string;
  password: string;
  roleId: string;
  locationId: string;
  name: string;
  position: string;
  area: string;
  department: string;
  contractType: EmployeeContractType;
  hireDate: string;
  contractStart: string;
  contractEnd: string;
  salaryType: SalaryType;
  salaryAmount: string;
  epsName: string;
  pensionFundName: string;
  cesantiasFundName: string;
  arlName: string;
  arlRiskLevel: ArlRiskLevel;
  cajaCompensacion: string;
}
