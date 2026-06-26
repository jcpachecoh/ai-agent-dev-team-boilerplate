import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EmployeePositionsService } from '../service/employee-positions.service';
import { EmployeePositionsRepository } from '../repository/employee-positions.repository';
import { PayrollRepository } from '../repository/payroll.repository';

describe('EmployeePositionsService', () => {
  let service: EmployeePositionsService;
  let positionsRepository: jest.Mocked<EmployeePositionsRepository>;
  let payrollRepository: jest.Mocked<PayrollRepository>;

  const tenantId = 'tenant-1';
  const mockPosition = {
    id: 'pos-1',
    tenantId,
    title: 'Contador',
    area: 'Finanzas',
    baseSalaryRange: '4500000',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeePositionsService,
        {
          provide: EmployeePositionsRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByTitle: jest.fn(),
            countActiveEmployeesByPosition: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            deactivate: jest.fn(),
            findHistoryByEmployee: jest.fn(),
            closeOpenHistory: jest.fn(),
            createHistoryEntry: jest.fn(),
          },
        },
        {
          provide: PayrollRepository,
          useValue: {
            findById: jest.fn(),
            updateEmployeePositionAssignment: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(EmployeePositionsService);
    positionsRepository = module.get(EmployeePositionsRepository);
    payrollRepository = module.get(PayrollRepository);
  });

  it('creates position on happy path', async () => {
    positionsRepository.findByTitle.mockResolvedValue(null);
    positionsRepository.create.mockResolvedValue(mockPosition);

    const result = await service.create(tenantId, {
      title: 'Contador',
      area: 'Finanzas',
      baseSalaryRange: '4500000',
    });

    expect(result.title).toBe('Contador');
  });

  it('rejects duplicate title on create', async () => {
    positionsRepository.findByTitle.mockResolvedValue(mockPosition);

    await expect(
      service.create(tenantId, {
        title: 'Contador',
        area: 'Finanzas',
        baseSalaryRange: '4500000',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects negative baseSalaryRange', async () => {
    await expect(
      service.create(tenantId, {
        title: 'Contador',
        area: 'Finanzas',
        baseSalaryRange: '-1',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates title when unique', async () => {
    positionsRepository.findById.mockResolvedValue(mockPosition);
    positionsRepository.findByTitle.mockResolvedValue(null);
    positionsRepository.update.mockResolvedValue({ ...mockPosition, title: 'Analista' });

    const result = await service.update(tenantId, 'pos-1', { title: 'Analista' });

    expect(result.title).toBe('Analista');
  });

  it('deactivates when no active employees', async () => {
    positionsRepository.findById.mockResolvedValue(mockPosition);
    positionsRepository.countActiveEmployeesByPosition.mockResolvedValue(0);
    positionsRepository.deactivate.mockResolvedValue({ ...mockPosition, isActive: false });

    const result = await service.deactivate(tenantId, 'pos-1');

    expect(result.isActive).toBe(false);
  });

  it('rejects deactivate when active employees assigned', async () => {
    positionsRepository.findById.mockResolvedValue(mockPosition);
    positionsRepository.countActiveEmployeesByPosition.mockResolvedValue(1);

    await expect(service.deactivate(tenantId, 'pos-1')).rejects.toThrow(ConflictException);
  });

  it('throws NotFoundException when position missing', async () => {
    positionsRepository.findById.mockResolvedValue(null);

    await expect(service.findById(tenantId, 'missing')).rejects.toThrow(NotFoundException);
  });

  it('assignPositionToEmployee creates history and updates employee', async () => {
    positionsRepository.findById.mockResolvedValue(mockPosition);
    payrollRepository.findById.mockResolvedValue({
      id: 'emp-1',
      tenantId,
      positionId: null,
    } as never);

    await service.assignPositionToEmployee(tenantId, 'emp-1', 'pos-1', 'user-1');

    expect(positionsRepository.closeOpenHistory).toHaveBeenCalled();
    expect(positionsRepository.createHistoryEntry).toHaveBeenCalled();
    expect(payrollRepository.updateEmployeePositionAssignment).toHaveBeenCalledWith('emp-1', {
      positionId: 'pos-1',
      position: 'Contador',
    });
  });

  it('assignPositionToEmployee closes previous history', async () => {
    positionsRepository.findById.mockResolvedValue(mockPosition);
    payrollRepository.findById.mockResolvedValue({
      id: 'emp-1',
      tenantId,
      positionId: 'pos-old',
    } as never);

    await service.assignPositionToEmployee(tenantId, 'emp-1', 'pos-1');

    expect(positionsRepository.closeOpenHistory).toHaveBeenCalled();
  });

  it('assignPositionToEmployee rejects inactive position', async () => {
    positionsRepository.findById.mockResolvedValue({ ...mockPosition, isActive: false });

    await expect(service.assignPositionToEmployee(tenantId, 'emp-1', 'pos-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('assignPositionToEmployee is no-op when same position', async () => {
    positionsRepository.findById.mockResolvedValue(mockPosition);
    payrollRepository.findById.mockResolvedValue({
      id: 'emp-1',
      tenantId,
      positionId: 'pos-1',
    } as never);

    await service.assignPositionToEmployee(tenantId, 'emp-1', 'pos-1');

    expect(positionsRepository.createHistoryEntry).not.toHaveBeenCalled();
  });

  it('getEmployeePositionHistory delegates to repository', async () => {
    payrollRepository.findById.mockResolvedValue({ id: 'emp-1', tenantId } as never);
    positionsRepository.findHistoryByEmployee.mockResolvedValue([]);

    const result = await service.getEmployeePositionHistory(tenantId, 'emp-1');

    expect(result).toEqual([]);
    expect(positionsRepository.findHistoryByEmployee).toHaveBeenCalledWith(tenantId, 'emp-1');
  });

  it('getEmployeePositionHistory throws when employee missing', async () => {
    payrollRepository.findById.mockResolvedValue(null);

    await expect(service.getEmployeePositionHistory(tenantId, 'emp-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('findAll delegates to repository', async () => {
    positionsRepository.findAll.mockResolvedValue([mockPosition]);

    const result = await service.findAll(tenantId, { area: 'Finanzas' });

    expect(result).toHaveLength(1);
    expect(positionsRepository.findAll).toHaveBeenCalledWith(tenantId, { area: 'Finanzas' });
  });
});
