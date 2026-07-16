export type EmployeeContractType = 'FIJO' | 'INDEFINIDO' | 'OBRA' | 'PRESTACION' | 'APRENDIZAJE';

export type SalaryType = 'ORDINARIO' | 'INTEGRAL';

export type ArlRiskLevel = 'RIESGO_I' | 'RIESGO_II' | 'RIESGO_III' | 'RIESGO_IV' | 'RIESGO_V';

export type DocumentType = 'CC' | 'CE' | 'NIT' | 'PASSPORT';

export type CostCenter =
  | 'ADMINISTRATIVO'
  | 'OPERACIONES'
  | 'PLANTA'
  | 'GERENCIA'
  | 'INCAPACIDADES'
  | 'ROTANTE';

export type LaborClassification = 'COCINA' | 'SERVICIO' | 'ADMINISTRATIVO';

export type BeneficiaryRelationshipType =
  | 'FATHER'
  | 'MOTHER'
  | 'SPOUSE'
  | 'CHILD'
  | 'MINOR_IN_CHARGE'
  | 'ORPHAN_SIBLING';

export type BeneficiaryDisabilityType =
  | 'NOT_APPLICABLE'
  | 'PHYSICAL'
  | 'AUDITORY'
  | 'VISUAL'
  | 'DEAFBLINDNESS'
  | 'INTELLECTUAL_COGNITIVE'
  | 'PSYCHOSOCIAL'
  | 'MULTIPLE';

/** Tipos de documento soportados por el backend para el familiar (independiente del `DocumentType` del empleado). */
export type BeneficiaryDocumentType = 'CC' | 'CE' | 'PASAPORTE' | 'TI' | 'PEP';

export interface BeneficiaryFormRow {
  documentType: BeneficiaryDocumentType | '';
  documentNumber: string;
  relationshipType: BeneficiaryRelationshipType;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  fechaNacimiento: string;
  disability: BeneficiaryDisabilityType;
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
  /** null cuando costCenter = ROTANTE (CONN-06) — sede diaria resuelta por turno/marcación. */
  locationId: string | null;
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
    primerNombre: string | null;
    segundoNombre: string | null;
    primerApellido: string | null;
    segundoApellido: string | null;
    documentType: BeneficiaryDocumentType | null;
    documentNumber: string | null;
    relationshipType: BeneficiaryRelationshipType;
    disability: BeneficiaryDisabilityType;
    birthDate: string;
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

export interface PayrollEmployeesListResponse {
  items: PayrollEmployee[];
  total: number;
  limit: number;
  offset: number;
  summary: {
    total: number;
    active: number;
    inactive: number;
  };
}

export interface CreatePayrollEmployeeInput {
  cedula: string;
  documentType: DocumentType;
  email: string;
  roleId?: string;
  /** Omitido/null cuando costCenter = ROTANTE (OS-531/CONN-06). */
  locationId?: string;
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
    documentType?: BeneficiaryDocumentType;
    documentNumber?: string;
    primerNombre: string;
    segundoNombre?: string;
    primerApellido: string;
    segundoApellido?: string;
    relationshipType: BeneficiaryRelationshipType;
    disability: BeneficiaryDisabilityType;
    fechaNacimiento: string;
  }>;
}

export type UpdatePayrollEmployeeInput = Partial<Omit<CreatePayrollEmployeeInput, 'locationId'>> & {
  isActive?: boolean;
  photoStorageObjectId?: string | null;
  /** null explícito limpia la sede fija — requerido al cambiar costCenter a ROTANTE. */
  locationId?: string | null;
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
