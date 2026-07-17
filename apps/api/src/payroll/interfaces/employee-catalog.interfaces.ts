import type { EmployeeCatalogType } from '@prisma/client';

export interface EmployeeCatalogOptionRecord {
  id: string;
  tenantId: string;
  type: EmployeeCatalogType;
  name: string;
  pilaCode: string | null;
  isActive: boolean;
}

export interface ListEmployeeCatalogOptions {
  type?: EmployeeCatalogType;
  /** Default false — request forms. true — admin management. */
  includeInactive?: boolean;
}

export interface CreateEmployeeCatalogOptionData {
  type: EmployeeCatalogType;
  name: string;
  pilaCode?: string | null;
}

export interface UpdateEmployeeCatalogOptionData {
  name?: string;
  isActive?: boolean;
  pilaCode?: string | null;
}

export interface IEmployeeCatalogRepository {
  findAll(
    tenantId: string,
    options?: ListEmployeeCatalogOptions,
  ): Promise<EmployeeCatalogOptionRecord[]>;
  findById(tenantId: string, id: string): Promise<EmployeeCatalogOptionRecord | null>;
  findByTypeAndNameInsensitive(
    tenantId: string,
    type: EmployeeCatalogType,
    name: string,
  ): Promise<EmployeeCatalogOptionRecord | null>;
  findActiveByTypeAndPilaCode(
    tenantId: string,
    type: EmployeeCatalogType,
    pilaCode: string,
  ): Promise<EmployeeCatalogOptionRecord | null>;
  /** Active option by primary key scoped to tenant + type (OS-606 OVERTIME_REASON). */
  findActiveByIdAndType(
    tenantId: string,
    id: string,
    type: EmployeeCatalogType,
  ): Promise<EmployeeCatalogOptionRecord | null>;
  countOvertimeRequestReferences(tenantId: string, reasonOptionId: string): Promise<number>;
  create(
    tenantId: string,
    data: CreateEmployeeCatalogOptionData,
  ): Promise<EmployeeCatalogOptionRecord>;
  update(
    tenantId: string,
    id: string,
    data: UpdateEmployeeCatalogOptionData,
  ): Promise<EmployeeCatalogOptionRecord | null>;
}

export interface IEmployeeCatalogService {
  findAll(
    tenantId: string,
    options?: ListEmployeeCatalogOptions,
  ): Promise<EmployeeCatalogOptionRecord[]>;
  findActiveByIdAndType(
    tenantId: string,
    id: string,
    type: EmployeeCatalogType,
  ): Promise<EmployeeCatalogOptionRecord | null>;
  create(
    tenantId: string,
    data: CreateEmployeeCatalogOptionData,
  ): Promise<EmployeeCatalogOptionRecord>;
  update(
    tenantId: string,
    id: string,
    data: UpdateEmployeeCatalogOptionData,
  ): Promise<EmployeeCatalogOptionRecord>;
  deactivate(tenantId: string, id: string): Promise<EmployeeCatalogOptionRecord>;
}
