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
    supervisors: [],
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
            findByIds: jest.fn(),
            countActiveEmployeesByPosition: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            deactivate: jest.fn(),
            findSupervisorsByPositionIds: jest.fn(),
            findSubordinatePositionIds: jest.fn(),
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

    positionsRepository.findSubordinatePositionIds.mockResolvedValue([]);
  });

  it('creates position on happy path with an empty supervisorPositionIds', async () => {
    positionsRepository.findByTitle.mockResolvedValue(null);
    positionsRepository.create.mockResolvedValue(mockPosition);

    const result = await service.create(tenantId, {
      title: 'Contador',
      area: 'Finanzas',
      baseSalaryRange: '4500000',
    });

    expect(result.title).toBe('Contador');
    // Un solo call a create(): la posición y sus (cero) supervisores viajan juntos al
    // repository, que los persiste en la misma transacción — no hay un segundo paso separado.
    expect(positionsRepository.create).toHaveBeenCalledTimes(1);
    expect(positionsRepository.create).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ supervisorPositionIds: [] }),
    );
  });

  it('creates position with supervisorPositionIds in a single repository call', async () => {
    positionsRepository.findByTitle.mockResolvedValue(null);
    positionsRepository.findByIds.mockResolvedValue([
      { ...mockPosition, id: 'pos-boss', title: 'Gerente' },
    ]);
    positionsRepository.create.mockResolvedValue({
      ...mockPosition,
      supervisors: [{ id: 'pos-boss', title: 'Gerente' }],
    });

    const result = await service.create(tenantId, {
      title: 'Contador',
      area: 'Finanzas',
      baseSalaryRange: '4500000',
      supervisorPositionIds: ['pos-boss'],
    });

    expect(positionsRepository.create).toHaveBeenCalledTimes(1);
    expect(positionsRepository.create).toHaveBeenCalledWith(tenantId, {
      title: 'Contador',
      area: 'Finanzas',
      baseSalaryRange: '4500000',
      supervisorPositionIds: ['pos-boss'],
    });
    expect(result.supervisors).toEqual([{ id: 'pos-boss', title: 'Gerente' }]);
  });

  it('propagates a repository failure on create without swallowing it (no partial success)', async () => {
    positionsRepository.findByTitle.mockResolvedValue(null);
    positionsRepository.findByIds.mockResolvedValue([
      { ...mockPosition, id: 'pos-boss', title: 'Gerente' },
    ]);
    positionsRepository.create.mockRejectedValue(new Error('transaction rolled back'));

    await expect(
      service.create(tenantId, {
        title: 'Contador',
        area: 'Finanzas',
        baseSalaryRange: '4500000',
        supervisorPositionIds: ['pos-boss'],
      }),
    ).rejects.toThrow('transaction rolled back');
  });

  it('rejects create when a supervisorPositionId does not belong to the tenant', async () => {
    positionsRepository.findByTitle.mockResolvedValue(null);
    positionsRepository.findByIds.mockResolvedValue([]);

    await expect(
      service.create(tenantId, {
        title: 'Contador',
        area: 'Finanzas',
        baseSalaryRange: '4500000',
        supervisorPositionIds: ['pos-other-tenant'],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(positionsRepository.create).not.toHaveBeenCalled();
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

  it('updates title when unique, without touching supervisorPositionIds', async () => {
    positionsRepository.findById.mockResolvedValue(mockPosition);
    positionsRepository.findByTitle.mockResolvedValue(null);
    positionsRepository.update.mockResolvedValue({ ...mockPosition, title: 'Analista' });

    const result = await service.update(tenantId, 'pos-1', { title: 'Analista' });

    expect(result.title).toBe('Analista');
    expect(positionsRepository.update).toHaveBeenCalledTimes(1);
    expect(positionsRepository.update).toHaveBeenCalledWith(tenantId, 'pos-1', {
      title: 'Analista',
    });
  });

  it('update replaces supervisors in a single repository call when supervisorPositionIds is provided', async () => {
    positionsRepository.findById.mockResolvedValue(mockPosition);
    positionsRepository.findByIds.mockResolvedValue([
      { ...mockPosition, id: 'pos-boss', title: 'Gerente' },
    ]);
    positionsRepository.update.mockResolvedValue({
      ...mockPosition,
      supervisors: [{ id: 'pos-boss', title: 'Gerente' }],
    });

    const result = await service.update(tenantId, 'pos-1', {
      supervisorPositionIds: ['pos-boss'],
    });

    expect(positionsRepository.update).toHaveBeenCalledTimes(1);
    expect(positionsRepository.update).toHaveBeenCalledWith(tenantId, 'pos-1', {
      supervisorPositionIds: ['pos-boss'],
    });
    expect(result.supervisors).toEqual([{ id: 'pos-boss', title: 'Gerente' }]);
  });

  it('update clears supervisors when supervisorPositionIds is an empty array (distinguished from omitted)', async () => {
    positionsRepository.findById.mockResolvedValue({
      ...mockPosition,
      supervisors: [{ id: 'pos-boss', title: 'Gerente' }],
    });
    positionsRepository.update.mockResolvedValue({ ...mockPosition, supervisors: [] });

    const result = await service.update(tenantId, 'pos-1', { supervisorPositionIds: [] });

    // [] es un valor definido (no omitido): debe viajar al repository para limpiar la
    // relación, no debe tratarse como "no tocar" (`supervisorPositionIds?.length` fallaría
    // aquí porque `[].length` es 0/falsy).
    expect(positionsRepository.update).toHaveBeenCalledWith(tenantId, 'pos-1', {
      supervisorPositionIds: [],
    });
    expect(result.supervisors).toEqual([]);
  });

  it('update leaves existing supervisors untouched when supervisorPositionIds is omitted', async () => {
    positionsRepository.findById.mockResolvedValue(mockPosition);
    positionsRepository.update.mockResolvedValue(mockPosition);

    await service.update(tenantId, 'pos-1', { title: 'Analista Senior' });

    // Campo omitido: la llamada al repository no debe incluir la clave en absoluto (ni
    // siquiera como `undefined`), y no debe dispararse ninguna validación de supervisores.
    expect(positionsRepository.update).toHaveBeenCalledWith(tenantId, 'pos-1', {
      title: 'Analista Senior',
    });
    expect(positionsRepository.findByIds).not.toHaveBeenCalled();
  });

  it('propagates a repository failure on update without swallowing it (no partial success)', async () => {
    positionsRepository.findById.mockResolvedValue(mockPosition);
    positionsRepository.findByIds.mockResolvedValue([
      { ...mockPosition, id: 'pos-boss', title: 'Gerente' },
    ]);
    positionsRepository.update.mockRejectedValue(new Error('transaction rolled back'));

    await expect(
      service.update(tenantId, 'pos-1', { title: 'Analista', supervisorPositionIds: ['pos-boss'] }),
    ).rejects.toThrow('transaction rolled back');
  });

  it('rejects self-supervision on update', async () => {
    positionsRepository.findById.mockResolvedValue(mockPosition);

    await expect(
      service.update(tenantId, 'pos-1', { supervisorPositionIds: ['pos-1'] }),
    ).rejects.toThrow(BadRequestException);
    expect(positionsRepository.update).not.toHaveBeenCalled();
  });

  it('rejects supervisorPositionId belonging to another tenant', async () => {
    positionsRepository.findById.mockResolvedValue(mockPosition);
    positionsRepository.findByIds.mockResolvedValue([]);

    await expect(
      service.update(tenantId, 'pos-1', { supervisorPositionIds: ['pos-other-tenant'] }),
    ).rejects.toThrow(BadRequestException);
    expect(positionsRepository.update).not.toHaveBeenCalled();
  });

  it('rejects a direct hierarchy cycle', async () => {
    // Operario ya reporta a Coordinador (pos-1). Se intenta asignar a Operario como
    // supervisor de Coordinador -> pos-1 tendría a su propio subordinado como supervisor.
    positionsRepository.findById.mockResolvedValue(mockPosition);
    positionsRepository.findByIds.mockResolvedValue([
      { ...mockPosition, id: 'pos-operario', title: 'Operario' },
    ]);
    positionsRepository.findSubordinatePositionIds.mockResolvedValue(['pos-operario']);

    await expect(
      service.update(tenantId, 'pos-1', { supervisorPositionIds: ['pos-operario'] }),
    ).rejects.toThrow(ConflictException);
    expect(positionsRepository.update).not.toHaveBeenCalled();
  });

  it('rejects an indirect (transitive) hierarchy cycle', async () => {
    // pos-grandchild reporta transitivamente a pos-1 (via pos-child). Asignarlo como
    // supervisor de pos-1 cerraría un ciclo de longitud 3.
    positionsRepository.findById.mockResolvedValue(mockPosition);
    positionsRepository.findByIds.mockResolvedValue([
      { ...mockPosition, id: 'pos-grandchild', title: 'Auxiliar' },
    ]);
    positionsRepository.findSubordinatePositionIds.mockResolvedValue([
      'pos-child',
      'pos-grandchild',
    ]);

    await expect(
      service.update(tenantId, 'pos-1', { supervisorPositionIds: ['pos-grandchild'] }),
    ).rejects.toThrow(ConflictException);
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
