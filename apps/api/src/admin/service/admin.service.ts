import { Injectable } from '@nestjs/common';
import type { AdminHealthResponse, IAdminService } from '../interfaces/admin.interfaces';
import { AdminRepository } from '../repository/admin.repository';

@Injectable()
export class AdminService implements IAdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  getHealth(): Promise<AdminHealthResponse> {
    return this.adminRepository.getHealth();
  }
}
