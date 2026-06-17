import { Injectable } from '@nestjs/common';
import { TenantRepository } from '../repository/tenant.repository';
import type { ITenantService, Tenant } from '../interfaces/tenant.interfaces';

@Injectable()
export class TenantService implements ITenantService {
  constructor(private readonly tenantRepository: TenantRepository) {}

  findById(id: string): Promise<Tenant | null> {
    return this.tenantRepository.findById(id);
  }

  findAll(): Promise<Tenant[]> {
    return this.tenantRepository.findAll();
  }
}
