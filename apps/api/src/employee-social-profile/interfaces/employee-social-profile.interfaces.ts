import type { EmployeeRelationshipType, EmployeeSocialProfile } from '@prisma/client';

export interface CreateSocialProfileData {
  fullName: string;
  relationshipType: EmployeeRelationshipType;
  birthDate: Date;
  isDependent: boolean;
}

export interface UpdateSocialProfileData {
  fullName?: string;
  relationshipType?: EmployeeRelationshipType;
  birthDate?: Date;
  isDependent?: boolean;
}

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
    data: CreateSocialProfileData,
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
    data: UpdateSocialProfileData,
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
