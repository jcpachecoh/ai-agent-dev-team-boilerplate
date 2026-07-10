import { Test, TestingModule } from '@nestjs/testing';
import { EmployeePositionsResolver } from '../resolver/employee-positions.resolver';
import { EmployeePositionsService } from '../service/employee-positions.service';

describe('EmployeePositionsResolver', () => {
  let resolver: EmployeePositionsResolver;
  let service: jest.Mocked<EmployeePositionsService>;

  const tenantId = 'tenant-1';
  const user = { tenantId };
  const context = { req: { headers: { 'x-tenant-id': tenantId } } };
  const mockPosition = {
    id: 'pos-1',
    tenantId,
    title: 'Contador',
    area: 'Finanzas',
    baseSalaryRange: '4500000',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    supervisors: [{ id: 'pos-boss', title: 'Gerente General' }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeePositionsResolver,
        {
          provide: EmployeePositionsService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            deactivate: jest.fn(),
            getEmployeePositionHistory: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get(EmployeePositionsResolver);
    service = module.get(EmployeePositionsService);
  });

  it('queries employeePositions', async () => {
    service.findAll.mockResolvedValue([mockPosition]);

    const result = await resolver.employeePositions(user, context, false, 'Finanzas', 'cont');

    expect(service.findAll).toHaveBeenCalledWith(tenantId, {
      includeInactive: false,
      area: 'Finanzas',
      search: 'cont',
    });
    expect(result[0].title).toBe('Contador');
  });

  it('queries employeePosition by id', async () => {
    service.findById.mockResolvedValue(mockPosition);

    const result = await resolver.employeePosition(user, context, 'pos-1');

    expect(result.id).toBe('pos-1');
  });

  it('queries employeePositionHistory', async () => {
    service.getEmployeePositionHistory.mockResolvedValue([]);

    const result = await resolver.employeePositionHistory(user, context, 'emp-1');

    expect(result).toEqual([]);
  });

  it('creates employee position', async () => {
    service.create.mockResolvedValue(mockPosition);

    const result = await resolver.createEmployeePosition(user, context, {
      title: 'Contador',
      area: 'Finanzas',
      baseSalaryRange: 4500000,
    });

    expect(result.baseSalaryRange).toBe(4500000);
    expect(result.supervisors).toEqual([{ id: 'pos-boss', title: 'Gerente General' }]);
  });

  it('creates employee position with supervisorPositionIds', async () => {
    service.create.mockResolvedValue(mockPosition);

    await resolver.createEmployeePosition(user, context, {
      title: 'Contador',
      area: 'Finanzas',
      baseSalaryRange: 4500000,
      supervisorPositionIds: ['pos-boss'],
    });

    expect(service.create).toHaveBeenCalledWith(tenantId, {
      title: 'Contador',
      area: 'Finanzas',
      baseSalaryRange: '4500000',
      supervisorPositionIds: ['pos-boss'],
    });
  });

  it('updates employee position', async () => {
    service.update.mockResolvedValue({ ...mockPosition, title: 'Analista' });

    const result = await resolver.updateEmployeePosition(user, context, 'pos-1', {
      title: 'Analista',
    });

    expect(result.title).toBe('Analista');
  });

  it('updates employee position replacing supervisorPositionIds', async () => {
    service.update.mockResolvedValue(mockPosition);

    await resolver.updateEmployeePosition(user, context, 'pos-1', {
      supervisorPositionIds: ['pos-boss'],
    });

    expect(service.update).toHaveBeenCalledWith(tenantId, 'pos-1', {
      supervisorPositionIds: ['pos-boss'],
    });
  });

  it('deactivates employee position', async () => {
    service.deactivate.mockResolvedValue({ ...mockPosition, isActive: false });

    const result = await resolver.deactivateEmployeePosition(user, context, 'pos-1');

    expect(result.isActive).toBe(false);
  });
});
