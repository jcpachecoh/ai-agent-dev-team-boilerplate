import { Controller, Get } from '@nestjs/common';
import type { AdminHealthResponse } from '../interfaces/admin.interfaces';
import { AdminService } from '../service/admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('health')
  getHealth(): Promise<AdminHealthResponse> {
    return this.adminService.getHealth();
  }
}
