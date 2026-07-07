import type {
  BeneficiaryDisabilityType,
  DocumentType,
  EmployeeRelationshipType,
  EmployeeSocialProfile,
} from '@prisma/client';

export interface CreateSocialProfileData {
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  relationshipType: EmployeeRelationshipType;
  documentType?: DocumentType;
  documentNumber?: string;
  disability: BeneficiaryDisabilityType;
  birthDate: Date;
  isDependent: boolean;
}

export interface UpdateSocialProfileData {
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  relationshipType?: EmployeeRelationshipType;
  documentType?: DocumentType;
  documentNumber?: string;
  disability?: BeneficiaryDisabilityType;
  birthDate?: Date;
  isDependent?: boolean;
}

/** `fullName` is derived server-side by the service from the name parts. */
export type CreateSocialProfileRecord = CreateSocialProfileData & { fullName: string };
export type UpdateSocialProfileRecord = UpdateSocialProfileData & { fullName?: string };

export interface EmployeeRecord {
  id: string;
  tenantId: string;
  isActive: boolean;
  deletedAt: Date | null;
}

export interface IEmployeeSocialProfileRepository {
  findEmployee(employeeDetailsId: string): Promise<EmployeeRecord | null>;
  findEmployeeByUserId(userId: string): Promise<EmployeeRecord | null>;
  create(
    tenantId: string,
    employeeDetailsId: string,
    data: CreateSocialProfileRecord,
  ): Promise<EmployeeSocialProfile>;
  findAllByEmployee(tenantId: string, employeeDetailsId: string): Promise<EmployeeSocialProfile[]>;
  findById(
    tenantId: string,
    id: string,
    employeeDetailsId: string,
  ): Promise<EmployeeSocialProfile | null>;
  update(
    tenantId: string,
    id: string,
    employeeDetailsId: string,
    data: UpdateSocialProfileRecord,
  ): Promise<EmployeeSocialProfile>;
  softDelete(tenantId: string, id: string, employeeDetailsId: string): Promise<void>;
}

export interface IEmployeeSocialProfileService {
  create(
    tenantId: string,
    employeeDetailsId: string,
    data: CreateSocialProfileData,
  ): Promise<EmployeeSocialProfile>;
  findAllByEmployee(tenantId: string, employeeDetailsId: string): Promise<EmployeeSocialProfile[]>;
  findOne(tenantId: string, id: string, employeeDetailsId: string): Promise<EmployeeSocialProfile>;
  update(
    tenantId: string,
    id: string,
    employeeDetailsId: string,
    data: UpdateSocialProfileData,
  ): Promise<EmployeeSocialProfile>;
  remove(tenantId: string, id: string, employeeDetailsId: string): Promise<void>;
  findMyProfiles(userId: string, tenantId: string): Promise<EmployeeSocialProfile[]>;
}
