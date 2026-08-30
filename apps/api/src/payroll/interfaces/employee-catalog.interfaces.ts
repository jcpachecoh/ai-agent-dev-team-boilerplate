import { EmployeeCatalogType } from '@prisma/client';

export interface EmployeeCatalogOptionRecord {
  id: string;
  tenantId: string;
  type: EmployeeCatalogType;
  name: string;
  isActive: boolean;
}

export interface IEmployeeCatalogRepository {
  findAll(tenantId: string, type?: EmployeeCatalogType): Promise<EmployeeCatalogOptionRecord[]>;
}

export interface IEmployeeCatalogService {
  findAll(tenantId: string, type?: EmployeeCatalogType): Promise<EmployeeCatalogOptionRecord[]>;
}
