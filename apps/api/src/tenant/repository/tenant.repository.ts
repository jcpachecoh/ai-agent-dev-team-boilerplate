import { Injectable } from '@nestjs/common';
import type { ITenantRepository, Tenant } from '../interfaces/tenant.interfaces';

@Injectable()
export class TenantRepository implements ITenantRepository {
  async findById(id: string): Promise<Tenant | null> {
    return { id, name: `Tenant ${id}` };
  }

  async findAll(): Promise<Tenant[]> {
    return [];
  }
}
