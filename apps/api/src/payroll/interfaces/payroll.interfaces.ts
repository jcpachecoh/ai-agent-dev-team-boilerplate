import {
  EmployeeDetails,
  User,
  EmployeeContractType,
  SalaryType,
  ArlRiskLevel,
  DocumentType,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateEmployeeData {
  tenantId: string;
  userId?: string;
  roleId: string;
  email: string;
  cedula: string;
  documentType: DocumentType;
  passwordHash?: string;
  locationId: string;
  name: string;
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
}

export interface UpdateEmployeeData {
  locationId?: string;
  name?: string;
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
  isActive?: boolean;
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
}

export interface ListEmployeesFilters {
  tenantId: string;
  locationId?: string;
  contractType?: EmployeeContractType;
  isActive?: boolean;
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
}

export interface IPayrollRepository {
  create(
    data: CreateEmployeeData & { hasTransportSubsidy: boolean },
  ): Promise<EmployeeDetails & { user: User }>;
  findAll(filters: ListEmployeesFilters): Promise<(EmployeeDetails & { user: User })[]>;
  findById(id: string): Promise<(EmployeeDetails & { user: User }) | null>;
  findByUserId(userId: string): Promise<(EmployeeDetails & { user: User }) | null>;
  update(
    userId: string,
    payload: UpdateEmployeePayload,
  ): Promise<EmployeeDetails & { user: User; location?: { id: string; name: string } }>;
  softDelete(userId: string): Promise<void>;
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
}

export interface IPayrollService {
  create(tenantId: string, data: any): Promise<EmployeeDetails & { user: User }>;
  findAll(tenantId: string, filters: any): Promise<(EmployeeDetails & { user: User })[]>;
  findOne(tenantId: string, userId: string): Promise<EmployeeDetails & { user: User }>;
  update(
    tenantId: string,
    userId: string,
    data: any,
  ): Promise<EmployeeDetails & { user: User; location?: { id: string; name: string } }>;
  remove(tenantId: string, userId: string): Promise<void>;
  findByLocation(
    tenantId: string,
    locationId: string,
  ): Promise<(EmployeeDetails & { user: User })[]>;
  findByContractType(
    tenantId: string,
    contractType: EmployeeContractType,
  ): Promise<(EmployeeDetails & { user: User })[]>;
}
