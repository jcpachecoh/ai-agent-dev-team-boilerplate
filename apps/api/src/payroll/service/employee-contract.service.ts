import { Injectable, NotFoundException } from '@nestjs/common';
import { EmployeeContractType, type ContractTerminationReason } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import {
  EmploymentContractRecord,
  IEmployeeContractService,
} from '../interfaces/employee-contract.interfaces';
import { EmployeeContractRepository } from '../repository/employee-contract.repository';

@Injectable()
export class EmployeeContractService implements IEmployeeContractService {
  constructor(
    private readonly repository: EmployeeContractRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getActiveContract(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmploymentContractRecord | null> {
    return this.repository.findActiveContract(tenantId, employeeDetailsId);
  }

  async listByEmployee(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmploymentContractRecord[]> {
    return this.repository.findAllByEmployee(tenantId, employeeDetailsId);
  }

  async terminateActiveContract(
    tenantId: string,
    employeeDetailsId: string,
    data: {
      terminationDate: Date;
      terminationReason: ContractTerminationReason;
      terminationNotes?: string;
    },
    changedBy?: string,
  ): Promise<EmploymentContractRecord> {
    const active = await this.repository.findActiveContract(tenantId, employeeDetailsId);
    if (!active) {
      throw new NotFoundException(
        `El empleado ${employeeDetailsId} no tiene un contrato ACTIVO para terminar`,
      );
    }

    return this.prisma.$transaction(
      (tx): Promise<EmploymentContractRecord> =>
        this.repository.terminateActiveContractTx(tx, {
          tenantId,
          employeeDetailsId,
          terminationDate: data.terminationDate,
          terminationReason: data.terminationReason,
          terminationNotes: data.terminationNotes ?? null,
          changedBy,
        }),
    );
  }

  async rehire(
    tenantId: string,
    employeeDetailsId: string,
    data: {
      contractType: EmployeeContractType;
      startDate: Date;
      agreedEndDate?: Date | null;
    },
    changedBy?: string,
  ): Promise<EmploymentContractRecord> {
    return this.prisma.$transaction(
      (tx): Promise<EmploymentContractRecord> =>
        this.repository.startNewContractTx(tx, {
          tenantId,
          employeeDetailsId,
          contractType: data.contractType,
          startDate: data.startDate,
          agreedEndDate: data.agreedEndDate ?? null,
          changedBy,
        }),
    );
  }
}
