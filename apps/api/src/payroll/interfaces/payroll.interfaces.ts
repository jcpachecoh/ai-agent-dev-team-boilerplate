import {
  EmployeeDetails,
  EmployeePersonalData,
  User,
  EmployeeContractType,
  SalaryType,
  ArlRiskLevel,
  DocumentType,
  CostCenter,
  LaborClassification,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateEmployeeData {
  tenantId: string;
  userId?: string;
  roleId?: string;
  email: string;
  cedula: string;
  documentType: DocumentType;
  passwordHash?: string;
  locationId: string;
  name: string;
  positionId?: string;
  position: string;
  area: string;
  department: string;
  contractType: EmployeeContractType;
  hireDate: Date;
  contractStart: Date;
  contractEnd?: Date | null;
  salaryType: SalaryType;
  salaryAmount: number | Decimal;
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
  nonSalaryAmount?: number | Decimal | null;
  /** OS-588 — actor que origina la creación, propagado al historial salarial/de fondos. */
  changedBy?: string;
}

export interface UpdateEmployeeData {
  locationId?: string;
  name?: string;
  positionId?: string;
  position?: string;
  area?: string;
  department?: string;
  contractType?: EmployeeContractType;
  hireDate?: Date | string;
  contractStart?: Date | string;
  contractEnd?: Date | string | null;
  salaryType?: SalaryType;
  salaryAmount?: number | Decimal;
  epsName?: string;
  pensionFundName?: string;
  cesantiasFundName?: string;
  arlName?: string;
  arlRiskLevel?: ArlRiskLevel;
  cajaCompensacion?: string;
  barrio?: string;
  localidad?: string;
  costCenter?: CostCenter;
  laborClassification?: LaborClassification;
  nonSalaryAmount?: number | Decimal | null;
  isActive?: boolean;
  photoStorageObjectId?: string | null;
}

export interface UpdateEmployeeUserData {
  cedula?: string;
  documentType?: DocumentType;
  email?: string;
  roleId?: string;
  passwordHash?: string;
}

export interface LinkedUserRecord {
  id: string;
  email: string;
  cedula: string;
}

export interface UpdateEmployeePayload {
  employee: UpdateEmployeeData & { hasTransportSubsidy?: boolean };
  user?: UpdateEmployeeUserData;
  /** OS-588 — actor que origina el update, propagado al historial salarial/de fondos. */
  changedBy?: string;
}

export interface ListEmployeesFilters {
  tenantId: string;
  locationId?: string;
  /** Sedes permitidas cuando el actor está acotado por rol (SUPERVISOR/MANAGER) y no pidió una sede puntual. */
  allowedLocationIds?: string[] | null;
  contractType?: EmployeeContractType;
  isActive?: boolean;
  includeInactive?: boolean;
  positionId?: string;
  area?: string;
  department?: string;
  employeeId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface IPayrollRepository {
  create(
    data: CreateEmployeeData & { hasTransportSubsidy: boolean },
  ): Promise<EmployeeDetails & { user: User }>;
  findAll(filters: ListEmployeesFilters): Promise<(EmployeeDetails & { user: User })[]>;
  /**
   * OS-588 (fase 3) — lectura en batch (sin paginar) para exportaciones: trae user +
   * personalData de un conjunto puntual de employeeIds en una sola query, evitando N+1.
   * `personalData` puede ser null (dato opcional por empleado, ver EmployeePersonalData).
   */
  findManyWithPersonalDataByIds(
    tenantId: string,
    employeeIds: string[],
  ): Promise<(EmployeeDetails & { user: User; personalData: EmployeePersonalData | null })[]>;
  findById(id: string): Promise<(EmployeeDetails & { user: User }) | null>;
  findByUserId(userId: string): Promise<(EmployeeDetails & { user: User }) | null>;
  update(
    userId: string,
    payload: UpdateEmployeePayload,
  ): Promise<EmployeeDetails & { user: User; location?: { id: string; name: string } }>;
  softDelete(userId: string): Promise<EmployeeDetails & { user: User }>;
  count(filters: ListEmployeesFilters): Promise<number>;
  findExistingUser(tenantId: string, email: string, cedula: string): Promise<{ id: string } | null>;
  findUserByEmail(tenantId: string, email: string): Promise<LinkedUserRecord | null>;
  findUserByCedula(tenantId: string, cedula: string): Promise<LinkedUserRecord | null>;
  findUserByEmailAndCedula(
    tenantId: string,
    email: string,
    cedula: string,
  ): Promise<LinkedUserRecord | null>;
  findLocationById(locationId: string): Promise<{ id: string; tenantId: string } | null>;
  findRoleById(roleId: string): Promise<{ id: string; tenantId: string } | null>;
  findRoleByTenantAndCode(
    tenantId: string,
    code: string,
  ): Promise<{ id: string; tenantId: string } | null>;
  updateEmployeePositionAssignment(
    employeeDetailsId: string,
    data: { positionId: string; position: string },
  ): Promise<void>;
}

/** Subconjunto del JwtPayload necesario para scoping de sede en lectura de nómina. */
export interface PayrollActor {
  userId: string;
  roleCode: string;
}

export interface IPayrollService {
  create(tenantId: string, data: any): Promise<EmployeeDetails & { user: User }>;
  findAll(
    tenantId: string,
    filters: any,
    actor: PayrollActor,
  ): Promise<(EmployeeDetails & { user: User })[]>;
  findOne(
    tenantId: string,
    userId: string,
    actor: PayrollActor,
  ): Promise<EmployeeDetails & { user: User }>;
  update(
    tenantId: string,
    userId: string,
    data: any,
  ): Promise<EmployeeDetails & { user: User; location?: { id: string; name: string } }>;
  remove(tenantId: string, userId: string): Promise<EmployeeDetails & { user: User }>;
  findByLocation(
    tenantId: string,
    locationId: string,
    actor: PayrollActor,
  ): Promise<(EmployeeDetails & { user: User })[]>;
  findByContractType(
    tenantId: string,
    contractType: EmployeeContractType,
    actor: PayrollActor,
  ): Promise<(EmployeeDetails & { user: User })[]>;
}
