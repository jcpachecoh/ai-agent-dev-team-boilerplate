export type EmployeeContractType = 'FIJO' | 'INDEFINIDO' | 'OBRA' | 'PRESTACION' | 'APRENDIZAJE';

export type SalaryType = 'ORDINARIO' | 'INTEGRAL';

export type ArlRiskLevel = 'RIESGO_I' | 'RIESGO_II' | 'RIESGO_III' | 'RIESGO_IV' | 'RIESGO_V';

export type DocumentType = 'CC' | 'CE' | 'NIT' | 'PASSPORT';

export type CostCenter = 'ADMINISTRATIVO' | 'OPERACIONES' | 'PLANTA' | 'GERENCIA' | 'INCAPACIDADES';

export type LaborClassification = 'COCINA' | 'SERVICIO' | 'ADMINISTRATIVO';

export type BeneficiaryRelationshipType = 'CHILD' | 'SPOUSE' | 'TUTOR';

export interface BeneficiaryFormRow {
  relationshipType: BeneficiaryRelationshipType;
  fullName: string;
  age: string;
}

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
  positionId?: string | null;
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
  photoStorageObjectId?: string | null;
  photoUrl?: string | null;
  barrio?: string | null;
  localidad?: string | null;
  costCenter?: CostCenter | null;
  laborClassification?: LaborClassification | null;
  nonSalaryAmount?: string | null;
  beneficiaries?: Array<{
    id: string;
    fullName: string;
    relationshipType: BeneficiaryRelationshipType;
    age: number;
  }>;
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
  isActive?: boolean;
  positionId?: string;
  area?: string;
  department?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreatePayrollEmployeeInput {
  cedula: string;
  documentType: DocumentType;
  email: string;
  roleId?: string;
  locationId: string;
  name: string;
  positionId?: string;
  position?: string;
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
  barrio?: string;
  localidad?: string;
  costCenter: CostCenter;
  laborClassification: LaborClassification;
  nonSalaryAmount?: number;
  beneficiaries?: Array<{
    fullName: string;
    relationshipType: BeneficiaryRelationshipType;
    age: number;
  }>;
}

export type UpdatePayrollEmployeeInput = Partial<CreatePayrollEmployeeInput> & {
  isActive?: boolean;
  photoStorageObjectId?: string | null;
};

export interface PayrollEmployeeFormValues {
  cedula: string;
  documentType: DocumentType;
  email: string;
  locationId: string;
  nombres: string;
  primerApellido: string;
  segundoApellido: string;
  positionId: string;
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
  barrio: string;
  localidad: string;
  costCenter: CostCenter;
  laborClassification: LaborClassification;
  nonSalaryAmount: string;
  beneficiaries: BeneficiaryFormRow[];
}
