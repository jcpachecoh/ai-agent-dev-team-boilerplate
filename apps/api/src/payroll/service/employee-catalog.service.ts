import { Injectable } from '@nestjs/common';
import { EmployeeCatalogType } from '@prisma/client';
import { EmployeeCatalogRepository } from '../repository/employee-catalog.repository';
import {
  EmployeeCatalogOptionRecord,
  IEmployeeCatalogService,
} from '../interfaces/employee-catalog.interfaces';

@Injectable()
export class EmployeeCatalogService implements IEmployeeCatalogService {
  constructor(private readonly employeeCatalogRepository: EmployeeCatalogRepository) {}

  findAll(tenantId: string, type?: EmployeeCatalogType): Promise<EmployeeCatalogOptionRecord[]> {
    return this.employeeCatalogRepository.findAll(tenantId, type);
  }
}
