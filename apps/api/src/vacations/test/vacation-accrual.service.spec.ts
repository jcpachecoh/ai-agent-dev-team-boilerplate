import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';

import { VacationsRepository } from '../repository/vacations.repository';
import { VacationAccrualService } from '../service/vacation-accrual.service';

const TENANT = 'tenant-1';
const EMPLOYEE_ID = 'emp-1';

describe('VacationAccrualService', () => {
  let service: VacationAccrualService;
  let repository: jest.Mocked<
    Pick<
      VacationsRepository,
      'findActiveEmployeesForAccrual' | 'findBalanceByEmployee' | 'upsertBalance'
    >
  >;

  beforeEach(async () => {
    repository = {
      findActiveEmployeesForAccrual: jest.fn(),
      findBalanceByEmployee: jest.fn(),
      upsertBalance: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [VacationAccrualService, { provide: VacationsRepository, useValue: repository }],
    }).compile();

    service = module.get(VacationAccrualService);
  });

  it('catch-up accrues three full months for a new employee', async () => {
    // Arrange
    const hireDate = new Date(2024, 0, 1);
    const referenceDate = new Date(2024, 3, 10);
    repository.findBalanceByEmployee.mockResolvedValue(null);
    repository.upsertBalance.mockImplementation(async (_tenantId, _employeeId, data) => ({
      id: 'balance-1',
      tenantId: TENANT,
      employeeId: EMPLOYEE_ID,
      accruedDays: data.accruedDays ?? new Decimal(0),
      takenDays: new Decimal(0),
      compensatedDays: new Decimal(0),
      lastAccrualDate: new Date(2024, 2, 1),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Act
    const result = await service.syncEmployeeBalance(TENANT, EMPLOYEE_ID, hireDate, referenceDate);

    // Assert
    expect(result.monthsAccrued).toBe(3);
    expect(result.totalDaysAccrued).toBeCloseTo(3.75, 2);
    expect(repository.upsertBalance).toHaveBeenCalledWith(
      TENANT,
      EMPLOYEE_ID,
      expect.objectContaining({
        accruedDays: expect.any(Decimal),
        lastAccrualDate: new Date(2024, 2, 1),
      }),
    );
    expect(result.balance.accruedDays.toNumber()).toBeCloseTo(3.75, 2);
  });

  it('prorates the hire month and accrues full months afterwards', async () => {
    // Arrange
    const hireDate = new Date(2024, 2, 15);
    const referenceDate = new Date(2024, 6, 1);
    repository.findBalanceByEmployee.mockResolvedValue(null);
    repository.upsertBalance.mockImplementation(async (_tenantId, _employeeId, data) => ({
      id: 'balance-1',
      tenantId: TENANT,
      employeeId: EMPLOYEE_ID,
      accruedDays: data.accruedDays ?? new Decimal(0),
      takenDays: new Decimal(0),
      compensatedDays: new Decimal(0),
      lastAccrualDate: data.lastAccrualDate ?? new Date(2024, 5, 1),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Act
    const result = await service.syncEmployeeBalance(TENANT, EMPLOYEE_ID, hireDate, referenceDate);

    // Assert
    expect(result.monthsAccrued).toBe(4);
    expect(result.totalDaysAccrued).toBeCloseTo(0.69 + 1.25 + 1.25 + 1.25, 2);
    expect(result.balance.lastAccrualDate).toEqual(new Date(2024, 5, 1));
  });

  it('does not duplicate accrual on a second run in the same period', async () => {
    // Arrange
    const hireDate = new Date(2024, 0, 1);
    const referenceDate = new Date(2024, 3, 10);
    const existingBalance = {
      id: 'balance-1',
      tenantId: TENANT,
      employeeId: EMPLOYEE_ID,
      accruedDays: new Decimal(3.75),
      takenDays: new Decimal(0),
      compensatedDays: new Decimal(0),
      lastAccrualDate: new Date(2024, 2, 1),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repository.findBalanceByEmployee.mockResolvedValue(existingBalance);

    // Act
    const result = await service.syncEmployeeBalance(TENANT, EMPLOYEE_ID, hireDate, referenceDate);

    // Assert
    expect(result.monthsAccrued).toBe(0);
    expect(repository.upsertBalance).not.toHaveBeenCalled();
    expect(result.balance.accruedDays.toNumber()).toBe(3.75);
  });

  it('creates a balance when the employee had no vacation record', async () => {
    // Arrange
    const hireDate = new Date(2026, 6, 15);
    const referenceDate = new Date(2026, 7, 5);
    repository.findBalanceByEmployee.mockResolvedValue(null);
    repository.upsertBalance.mockResolvedValue({
      id: 'balance-new',
      tenantId: TENANT,
      employeeId: EMPLOYEE_ID,
      accruedDays: new Decimal(0.54),
      takenDays: new Decimal(0),
      compensatedDays: new Decimal(0),
      lastAccrualDate: new Date(2026, 6, 1),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Act
    const result = await service.syncEmployeeBalance(TENANT, EMPLOYEE_ID, hireDate, referenceDate);

    // Assert
    expect(repository.upsertBalance).toHaveBeenCalled();
    expect(result.balance.id).toBe('balance-new');
  });

  it('processes all active employees for a tenant', async () => {
    // Arrange
    repository.findActiveEmployeesForAccrual.mockResolvedValue([
      { id: 'emp-1', hireDate: new Date(2024, 0, 1) },
      { id: 'emp-2', hireDate: new Date(2024, 1, 1) },
    ]);
    repository.findBalanceByEmployee.mockResolvedValue(null);
    repository.upsertBalance.mockResolvedValue({
      id: 'balance-1',
      tenantId: TENANT,
      employeeId: 'emp-1',
      accruedDays: new Decimal(1.25),
      takenDays: new Decimal(0),
      compensatedDays: new Decimal(0),
      lastAccrualDate: new Date(2024, 2, 1),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Act
    const result = await service.accrueForTenant(TENANT, new Date(2024, 3, 10));

    // Assert
    expect(result.employeesProcessed).toBe(2);
    expect(repository.findActiveEmployeesForAccrual).toHaveBeenCalledWith(TENANT);
  });

  it('counts skips when employee is already up to date', async () => {
    repository.findActiveEmployeesForAccrual.mockResolvedValue([
      { id: 'emp-1', hireDate: new Date(2024, 0, 1) },
    ]);
    repository.findBalanceByEmployee.mockResolvedValue({
      id: 'balance-1',
      tenantId: TENANT,
      employeeId: 'emp-1',
      accruedDays: new Decimal(3.75),
      takenDays: new Decimal(0),
      compensatedDays: new Decimal(0),
      lastAccrualDate: new Date(2024, 2, 1),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.accrueForTenant(TENANT, new Date(2024, 3, 10));

    expect(result.skips).toBe(1);
    expect(result.monthsAccrued).toBe(0);
    expect(repository.upsertBalance).not.toHaveBeenCalled();
  });

  it('increments errors when employee accrual fails', async () => {
    repository.findActiveEmployeesForAccrual.mockResolvedValue([
      { id: 'emp-1', hireDate: new Date(2024, 0, 1) },
    ]);
    repository.findBalanceByEmployee.mockRejectedValue(new Error('db down'));
    const errorSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => undefined);

    const result = await service.accrueForTenant(TENANT, new Date(2024, 3, 10));

    expect(result.errors).toBe(1);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('creates zero balance for new employee with no months to accrue yet', async () => {
    const hireDate = new Date(2026, 6, 15);
    const referenceDate = new Date(2026, 6, 5);
    repository.findBalanceByEmployee.mockResolvedValue(null);
    repository.upsertBalance.mockResolvedValue({
      id: 'balance-new',
      tenantId: TENANT,
      employeeId: EMPLOYEE_ID,
      accruedDays: new Decimal(0),
      takenDays: new Decimal(0),
      compensatedDays: new Decimal(0),
      lastAccrualDate: new Date(2026, 6, 1),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.syncEmployeeBalance(TENANT, EMPLOYEE_ID, hireDate, referenceDate);

    expect(result.monthsAccrued).toBe(0);
    expect(repository.upsertBalance).toHaveBeenCalledWith(
      TENANT,
      EMPLOYEE_ID,
      expect.objectContaining({
        accruedDays: expect.any(Decimal),
        lastAccrualDate: new Date(2026, 6, 1),
      }),
    );
  });
});
