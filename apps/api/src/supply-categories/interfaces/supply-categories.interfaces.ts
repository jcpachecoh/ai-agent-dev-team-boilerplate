import type { SupplyCategory } from '@prisma/client';

export interface ISupplyCategoriesRepository {
  findAll(tenantId: string, isActive?: boolean): Promise<SupplyCategory[]>;
  findOne(tenantId: string, id: string): Promise<SupplyCategory | null>;
  create(tenantId: string, data: { nombre: string; descripcion?: string }): Promise<SupplyCategory>;
  update(
    tenantId: string,
    id: string,
    data: { nombre?: string; descripcion?: string; isActive?: boolean },
  ): Promise<SupplyCategory>;
}

export interface ISupplyCategoriesService {
  findAll(tenantId: string, isActive?: boolean): Promise<SupplyCategory[]>;
  create(tenantId: string, data: { nombre: string; descripcion?: string }): Promise<SupplyCategory>;
  update(
    tenantId: string,
    id: string,
    data: { nombre?: string; descripcion?: string; isActive?: boolean },
  ): Promise<SupplyCategory>;
}
