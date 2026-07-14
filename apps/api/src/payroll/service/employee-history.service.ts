import { Injectable, NotFoundException } from '@nestjs/common';

import {
  EmployeeFundHistoryRecord,
  EmployeeFundHistoryType,
  EmployeeSalaryHistoryRecord,
  IEmployeeHistoryService,
} from '../interfaces/employee-history.interfaces';
import { EmployeeHistoryRepository } from '../repository/employee-history.repository';
import { PayrollRepository } from '../repository/payroll.repository';

/**
 * OS-588 (fase infraestructura) — lectura del historial salarial/de fondos. La escritura
 * ocurre exclusivamente vía `EmployeeHistoryRepository.sync*Tx`, invocada dentro de la
 * misma transacción que `PayrollRepository.create/update` y
 * `AdminUsersRepository.createWithEmployeeDetails` — no se expone un método de escritura
 * aquí para no habilitar una segunda ruta de escritura desincronizada de EmployeeDetails.
 */
@Injectable()
export class EmployeeHistoryService implements IEmployeeHistoryService {
  constructor(
    private readonly employeeHistoryRepository: EmployeeHistoryRepository,
    private readonly payrollRepository: PayrollRepository,
  ) {}

  async getSalaryHistory(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmployeeSalaryHistoryRecord[]> {
    await this.assertEmployeeExists(tenantId, employeeDetailsId);
    return this.employeeHistoryRepository.findSalaryHistoryByEmployee(tenantId, employeeDetailsId);
  }

  async getFundHistory(
    tenantId: string,
    employeeDetailsId: string,
    fundType?: EmployeeFundHistoryType,
  ): Promise<EmployeeFundHistoryRecord[]> {
    await this.assertEmployeeExists(tenantId, employeeDetailsId);
    return this.employeeHistoryRepository.findFundHistoryByEmployee(
      tenantId,
      employeeDetailsId,
      fundType,
    );
  }

  private async assertEmployeeExists(tenantId: string, employeeDetailsId: string): Promise<void> {
    const employee = await this.payrollRepository.findById(employeeDetailsId);
    if (!employee || employee.tenantId !== tenantId) {
      throw new NotFoundException(`Employee with id "${employeeDetailsId}" not found`);
    }
  }
}
