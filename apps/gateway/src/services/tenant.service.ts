import { BaseService } from './base.service';
import { NotFoundError } from '../utils/errors';

export interface Tenant {
  id: string;
  name: string;
}

/**
 * TenantService — placeholder until a Tenant model is added to the Prisma schema.
 */
export class TenantService extends BaseService {
  async findById(id: string): Promise<Tenant> {
    // Once a Tenant model exists in Prisma, replace this with a real query.
    // For now we stub a "found" result so dependent code can proceed.
    if (!id) throw new NotFoundError('Tenant', id);
    return { id, name: `Tenant ${id}` };
  }
}
