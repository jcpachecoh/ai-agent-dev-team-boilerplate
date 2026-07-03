import { Injectable } from '@nestjs/common';
import type { AdminHealthResponse, IAdminRepository } from '../interfaces/admin.interfaces';

@Injectable()
export class AdminRepository implements IAdminRepository {
  async getHealth(): Promise<AdminHealthResponse> {
    return { status: 'ok' };
  }
}
