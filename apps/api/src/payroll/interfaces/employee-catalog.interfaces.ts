import { EmployeeCatalogType } from '@prisma/client';

export interface EmployeeCatalogOptionRecord {
  id: string;
  tenantId: string;
  type: EmployeeCatalogType;
  name: string;
  pilaCode: string | null;
  isActive: boolean;
}

export interface IEmployeeCatalogRepository {
  findAll(tenantId: string, type?: EmployeeCatalogType): Promise<EmployeeCatalogOptionRecord[]>;
  findActiveByTypeAndPilaCode(
    tenantId: string,
    type: EmployeeCatalogType,
    pilaCode: string,
  ): Promise<EmployeeCatalogOptionRecord | null>;
}

export interface IEmployeeCatalogService {
  findAll(tenantId: string, type?: EmployeeCatalogType): Promise<EmployeeCatalogOptionRecord[]>;
}
