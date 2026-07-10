import { NotFoundException } from '@nestjs/common';
import { EmployeeCatalogType } from '@prisma/client';

import type { EmployeeHistoryRepository } from '../repository/employee-history.repository';
import type { PayrollRepository } from '../repository/payroll.repository';
import { EmployeeHistoryService } from '../service/employee-history.service';

describe('EmployeeHistoryService', (): void => {
  let service: EmployeeHistoryService;
  let findSalaryHistoryByEmployee: jest.Mock;
  let findFundHistoryByEmployee: jest.Mock;
  let findById: jest.Mock;

  const tenantId = 'tenant-1';
  const employeeDetailsId = 'emp-1';

  beforeEach((): void => {
    findSalaryHistoryByEmployee = jest.fn().mockResolvedValue([]);
    findFundHistoryByEmployee = jest.fn().mockResolvedValue([]);
    findById = jest.fn().mockResolvedValue({ id: employeeDetailsId, tenantId });

    const employeeHistoryRepository = {
      findSalaryHistoryByEmployee,
      findFundHistoryByEmployee,
    } as unknown as EmployeeHistoryRepository;

    const payrollRepository = { findById } as unknown as PayrollRepository;

    service = new EmployeeHistoryService(employeeHistoryRepository, payrollRepository);
  });

  describe('getSalaryHistory', (): void => {
    it('delegates to the repository once the employee is confirmed to belong to the tenant', async (): Promise<void> => {
      await service.getSalaryHistory(tenantId, employeeDetailsId);

      expect(findById).toHaveBeenCalledWith(employeeDetailsId);
      expect(findSalaryHistoryByEmployee).toHaveBeenCalledWith(tenantId, employeeDetailsId);
    });

    it('throws NotFoundException when the employee does not exist', async (): Promise<void> => {
      findById.mockResolvedValue(null);

      await expect(service.getSalaryHistory(tenantId, employeeDetailsId)).rejects.toThrow(
        NotFoundException,
      );
      expect(findSalaryHistoryByEmployee).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the employee belongs to a different tenant (aislamiento por tenant)', async (): Promise<void> => {
      findById.mockResolvedValue({ id: employeeDetailsId, tenantId: 'other-tenant' });

      await expect(service.getSalaryHistory(tenantId, employeeDetailsId)).rejects.toThrow(
        NotFoundException,
      );
      expect(findSalaryHistoryByEmployee).not.toHaveBeenCalled();
    });
  });

  describe('getFundHistory', (): void => {
    it('delegates to the repository with the requested fundType', async (): Promise<void> => {
      await service.getFundHistory(tenantId, employeeDetailsId, EmployeeCatalogType.CESANTIAS_FUND);

      expect(findFundHistoryByEmployee).toHaveBeenCalledWith(
        tenantId,
        employeeDetailsId,
        EmployeeCatalogType.CESANTIAS_FUND,
      );
    });

    it('throws NotFoundException for a cross-tenant employee', async (): Promise<void> => {
      findById.mockResolvedValue({ id: employeeDetailsId, tenantId: 'other-tenant' });

      await expect(service.getFundHistory(tenantId, employeeDetailsId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
