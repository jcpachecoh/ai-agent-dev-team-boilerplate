import { Injectable } from '@nestjs/common';
import { EmployeeCatalogType, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import {
  syncFundHistoryTx as applyFundHistorySync,
  syncSalaryHistoryTx as applySalaryHistorySync,
} from '../../shared/employee-history/sync-employee-history';
import {
  EmployeeFundHistoryRecord,
  EmployeeFundHistoryType,
  EmployeeSalaryHistoryRecord,
  IEmployeeHistoryRepository,
  SyncFundHistoryData,
  SyncSalaryHistoryData,
} from '../interfaces/employee-history.interfaces';

@Injectable()
export class EmployeeHistoryRepository implements IEmployeeHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSalaryHistoryByEmployee(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmployeeSalaryHistoryRecord[]> {
    const rows = await this.prisma.employeeSalaryHistory.findMany({
      where: { tenantId, employeeDetailsId },
      orderBy: { effectiveFrom: 'desc' },
    });
    return rows.map((row): EmployeeSalaryHistoryRecord => this.mapSalary(row));
  }

  async findFundHistoryByEmployee(
    tenantId: string,
    employeeDetailsId: string,
    fundType?: EmployeeFundHistoryType,
  ): Promise<EmployeeFundHistoryRecord[]> {
    const rows = await this.prisma.employeeFundHistory.findMany({
      where: { tenantId, employeeDetailsId, ...(fundType ? { fundType } : {}) },
      orderBy: { effectiveFrom: 'desc' },
    });
    return rows.map((row): EmployeeFundHistoryRecord => this.mapFund(row));
  }

  async findSalaryHistoryByEmployees(
    tenantId: string,
    employeeDetailsIds: string[],
  ): Promise<Map<string, EmployeeSalaryHistoryRecord[]>> {
    if (employeeDetailsIds.length === 0) {
      return new Map();
    }
    const rows = await this.prisma.employeeSalaryHistory.findMany({
      where: { tenantId, employeeDetailsId: { in: employeeDetailsIds } },
      orderBy: { effectiveFrom: 'asc' },
    });
    const byEmployee = new Map<string, EmployeeSalaryHistoryRecord[]>();
    for (const row of rows) {
      const mapped = this.mapSalary(row);
      const list = byEmployee.get(mapped.employeeDetailsId) ?? [];
      list.push(mapped);
      byEmployee.set(mapped.employeeDetailsId, list);
    }
    return byEmployee;
  }

  async findFundHistoryByEmployees(
    tenantId: string,
    employeeDetailsIds: string[],
    fundType?: EmployeeFundHistoryType,
  ): Promise<Map<string, EmployeeFundHistoryRecord[]>> {
    if (employeeDetailsIds.length === 0) {
      return new Map();
    }
    const rows = await this.prisma.employeeFundHistory.findMany({
      where: {
        tenantId,
        employeeDetailsId: { in: employeeDetailsIds },
        ...(fundType ? { fundType } : {}),
      },
      orderBy: { effectiveFrom: 'asc' },
    });
    const byEmployee = new Map<string, EmployeeFundHistoryRecord[]>();
    for (const row of rows) {
      const mapped = this.mapFund(row);
      const list = byEmployee.get(mapped.employeeDetailsId) ?? [];
      list.push(mapped);
      byEmployee.set(mapped.employeeDetailsId, list);
    }
    return byEmployee;
  }

  async syncSalaryHistoryTx(
    tx: Prisma.TransactionClient,
    data: SyncSalaryHistoryData,
  ): Promise<void> {
    return applySalaryHistorySync(tx, data);
  }

  async syncFundHistoryTx(tx: Prisma.TransactionClient, data: SyncFundHistoryData): Promise<void> {
    return applyFundHistorySync(tx, data);
  }

  private mapSalary(row: {
    id: string;
    tenantId: string;
    employeeDetailsId: string;
    salaryType: EmployeeSalaryHistoryRecord['salaryType'];
    salaryAmount: Prisma.Decimal;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    changedBy: string | null;
    createdAt: Date;
  }): EmployeeSalaryHistoryRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      employeeDetailsId: row.employeeDetailsId,
      salaryType: row.salaryType,
      salaryAmount: row.salaryAmount.toString(),
      effectiveFrom: row.effectiveFrom,
      effectiveTo: row.effectiveTo,
      changedBy: row.changedBy,
      createdAt: row.createdAt,
    };
  }

  private mapFund(row: {
    id: string;
    tenantId: string;
    employeeDetailsId: string;
    fundType: EmployeeCatalogType;
    fundName: string;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    changedBy: string | null;
    createdAt: Date;
  }): EmployeeFundHistoryRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      employeeDetailsId: row.employeeDetailsId,
      fundType: row.fundType as EmployeeFundHistoryType,
      fundName: row.fundName,
      effectiveFrom: row.effectiveFrom,
      effectiveTo: row.effectiveTo,
      changedBy: row.changedBy,
      createdAt: row.createdAt,
    };
  }
}
