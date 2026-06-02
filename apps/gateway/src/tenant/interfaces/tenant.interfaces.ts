export interface Tenant {
  id: string;
  name: string;
}

export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findAll(): Promise<Tenant[]>;
}

export interface ITenantService {
  findById(id: string): Promise<Tenant | null>;
  findAll(): Promise<Tenant[]>;
}
