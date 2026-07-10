import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EmployeePositionsController } from '../controller/employee-positions.controller';
import { EmployeePositionsService } from '../service/employee-positions.service';

describe('EmployeePositionsController', () => {
  let controller: EmployeePositionsController;
  let service: jest.Mocked<EmployeePositionsService>;

  const tenantId = 'tenant-1';
  const user = { tenantId, sub: 'user-1' };
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
      controllers: [EmployeePositionsController],
      providers: [
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

    controller = module.get(EmployeePositionsController);
    service = module.get(EmployeePositionsService);
  });

  it('lists positions', async () => {
    service.findAll.mockResolvedValue([mockPosition]);

    const result = await controller.findAll(user, tenantId, {});

    expect(service.findAll).toHaveBeenCalledWith(tenantId, {});
    expect(result[0].baseSalaryRange).toBe(4500000);
    expect(result[0].supervisors).toEqual([{ id: 'pos-boss', title: 'Gerente General' }]);
  });

  it('gets position by id', async () => {
    service.findById.mockResolvedValue(mockPosition);

    const result = await controller.findOne(user, tenantId, 'pos-1');

    expect(result.id).toBe('pos-1');
  });

  it('creates position', async () => {
    service.create.mockResolvedValue(mockPosition);

    const result = await controller.create(user, tenantId, {
      title: 'Contador',
      area: 'Finanzas',
      baseSalaryRange: 4500000,
    });

    expect(service.create).toHaveBeenCalledWith(tenantId, {
      title: 'Contador',
      area: 'Finanzas',
      baseSalaryRange: '4500000',
      supervisorPositionIds: undefined,
    });
    expect(result.title).toBe('Contador');
  });

  it('creates position with supervisorPositionIds', async () => {
    service.create.mockResolvedValue(mockPosition);

    await controller.create(user, tenantId, {
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

  it('updates position', async () => {
    service.update.mockResolvedValue({ ...mockPosition, title: 'Analista' });

    const result = await controller.update(user, tenantId, 'pos-1', { title: 'Analista' });

    expect(service.update).toHaveBeenCalledWith(tenantId, 'pos-1', { title: 'Analista' });
    expect(result.title).toBe('Analista');
  });

  it('updates position replacing supervisorPositionIds', async () => {
    service.update.mockResolvedValue(mockPosition);

    await controller.update(user, tenantId, 'pos-1', { supervisorPositionIds: ['pos-boss'] });

    expect(service.update).toHaveBeenCalledWith(tenantId, 'pos-1', {
      supervisorPositionIds: ['pos-boss'],
    });
  });

  it('updates position clearing supervisorPositionIds', async () => {
    service.update.mockResolvedValue({ ...mockPosition, supervisors: [] });

    await controller.update(user, tenantId, 'pos-1', { supervisorPositionIds: [] });

    expect(service.update).toHaveBeenCalledWith(tenantId, 'pos-1', {
      supervisorPositionIds: [],
    });
  });

  it('deactivates position', async () => {
    service.deactivate.mockResolvedValue({ ...mockPosition, isActive: false });

    const result = await controller.deactivate(user, tenantId, 'pos-1');

    expect(result.isActive).toBe(false);
  });

  it('returns employee position history', async () => {
    service.getEmployeePositionHistory.mockResolvedValue([]);

    const result = await controller.getEmployeeHistory(user, tenantId, 'emp-1');

    expect(service.getEmployeePositionHistory).toHaveBeenCalledWith(tenantId, 'emp-1');
    expect(result).toEqual([]);
  });

  it('throws when tenant id missing', async () => {
    await expect(controller.findAll({}, '', {})).rejects.toThrow(BadRequestException);
  });

  it('passes query filters to service', async () => {
    service.findAll.mockResolvedValue([]);

    await controller.findAll(user, tenantId, {
      includeInactive: true,
      area: 'Finanzas',
      search: 'cont',
    });

    expect(service.findAll).toHaveBeenCalledWith(tenantId, {
      includeInactive: true,
      area: 'Finanzas',
      search: 'cont',
    });
  });
});
