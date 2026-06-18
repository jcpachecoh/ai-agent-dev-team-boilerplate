import { EmployeeCatalogType, PrismaClient } from '@prisma/client';

/** Delegate shape for EmployeeCatalogOption — stable for seed scripts. */
interface EmployeeCatalogOptionDelegate {
  upsert(args: {
    where: { id: string };
    update: { name: string; isActive: boolean; type: EmployeeCatalogType };
    create: {
      id: string;
      tenantId: string;
      type: EmployeeCatalogType;
      name: string;
      isActive: boolean;
    };
  }): Promise<unknown>;
  updateMany(args: {
    where: {
      tenantId: string;
      type: { in: EmployeeCatalogType[] };
      id: { notIn: string[] };
      isActive: boolean;
    };
    data: { isActive: boolean };
  }): Promise<unknown>;
  count(args: { where: { tenantId: string; isActive: boolean } }): Promise<number>;
}

type PrismaWithEmployeeCatalog = PrismaClient & {
  employeeCatalogOption: EmployeeCatalogOptionDelegate;
};

export function employeeCatalogOptionClient(prisma: PrismaClient): EmployeeCatalogOptionDelegate {
  return (prisma as PrismaWithEmployeeCatalog).employeeCatalogOption;
}
