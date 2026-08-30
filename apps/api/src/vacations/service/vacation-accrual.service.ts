import { Injectable, Logger } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

import type { VacationBalanceRecord } from '../interfaces/vacations.interfaces';
import { VacationsRepository } from '../repository/vacations.repository';
import {
  addMonths,
  calculateMonthlyAccrual,
  getAccrualThroughMonth,
  startOfMonth,
} from '../utils/vacation-accrual.utils';

export interface VacationAccrualTenantResult {
  tenantId: string;
  employeesProcessed: number;
  monthsAccrued: number;
  totalDaysAccrued: number;
  skips: number;
  errors: number;
}

@Injectable()
export class VacationAccrualService {
  private readonly logger = new Logger(VacationAccrualService.name);

  constructor(private readonly repository: VacationsRepository) {}

  async accrueForTenant(
    tenantId: string,
    referenceDate: Date = new Date(),
  ): Promise<VacationAccrualTenantResult> {
    const employees = await this.repository.findActiveEmployeesForAccrual(tenantId);
    const result: VacationAccrualTenantResult = {
      tenantId,
      employeesProcessed: 0,
      monthsAccrued: 0,
      totalDaysAccrued: 0,
      skips: 0,
      errors: 0,
    };

    for (const employee of employees) {
      try {
        const employeeResult = await this.syncEmployeeBalance(
          tenantId,
          employee.id,
          employee.hireDate,
          referenceDate,
        );

        result.employeesProcessed += 1;
        if (employeeResult.monthsAccrued === 0) {
          result.skips += 1;
        } else {
          result.monthsAccrued += employeeResult.monthsAccrued;
          result.totalDaysAccrued += employeeResult.totalDaysAccrued;
        }
      } catch (error) {
        result.errors += 1;
        this.logger.error(
          `Vacation accrual failed for employee ${employee.id} (tenant ${tenantId}): ${String(error)}`,
        );
      }
    }

    this.logger.log(
      JSON.stringify({
        event: 'vacation_accrual_tenant_complete',
        ...result,
      }),
    );

    return result;
  }

  async syncEmployeeBalance(
    tenantId: string,
    employeeId: string,
    hireDate: Date,
    referenceDate: Date = new Date(),
  ): Promise<{ balance: VacationBalanceRecord; monthsAccrued: number; totalDaysAccrued: number }> {
    const accrualThroughMonth = getAccrualThroughMonth(referenceDate);
    const existingBalance = await this.repository.findBalanceByEmployee(tenantId, employeeId);

    let currentMonth = this.resolveFirstMonthToProcess(existingBalance, hireDate);
    let accruedDays = existingBalance?.accruedDays ?? new Decimal(0);
    let monthsAccrued = 0;
    let totalDaysAccrued = 0;
    let lastAccrualDate = existingBalance?.lastAccrualDate ?? new Date(0);

    while (currentMonth.getTime() <= accrualThroughMonth.getTime()) {
      const delta = calculateMonthlyAccrual(hireDate, currentMonth);
      if (delta > 0) {
        accruedDays = accruedDays.plus(delta);
        totalDaysAccrued += delta;
      }

      lastAccrualDate = startOfMonth(currentMonth);
      monthsAccrued += 1;
      currentMonth = addMonths(currentMonth, 1);
    }

    if (monthsAccrued === 0) {
      if (existingBalance) {
        return { balance: existingBalance, monthsAccrued: 0, totalDaysAccrued: 0 };
      }

      const balance = await this.repository.upsertBalance(tenantId, employeeId, {
        accruedDays: new Decimal(0),
        takenDays: new Decimal(0),
        compensatedDays: new Decimal(0),
        lastAccrualDate: startOfMonth(hireDate),
      });
      return { balance, monthsAccrued: 0, totalDaysAccrued: 0 };
    }

    const balance = await this.repository.upsertBalance(tenantId, employeeId, {
      accruedDays,
      lastAccrualDate,
    });

    return { balance, monthsAccrued, totalDaysAccrued };
  }

  private resolveFirstMonthToProcess(balance: VacationBalanceRecord | null, hireDate: Date): Date {
    if (!balance || balance.lastAccrualDate.getTime() === 0) {
      return startOfMonth(hireDate);
    }

    return addMonths(startOfMonth(balance.lastAccrualDate), 1);
  }
}
