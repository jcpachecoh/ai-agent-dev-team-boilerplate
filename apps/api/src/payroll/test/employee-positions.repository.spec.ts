import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { EmployeePositionsRepository } from '../repository/employee-positions.repository';
import { PrismaService } from '../../prisma/prisma.service';

describe('EmployeePositionsRepository', () => {
  let repository: EmployeePositionsRepository;
  let findMany: jest.Mock;
  let findFirst: jest.Mock;
  let create: jest.Mock;
  let update: jest.Mock;
  let count: jest.Mock;
  let historyFindMany: jest.Mock;
  let historyUpdateMany: jest.Mock;
  let historyCreate: jest.Mock;
  let supervisorFindMany: jest.Mock;
  let supervisorDeleteMany: jest.Mock;
  let supervisorCreateMany: jest.Mock;
  let transaction: jest.Mock;

  const tenantId = 'tenant-1';
  const mockPositionRow = {
    id: 'pos-1',
    tenantId,
    title: 'Contador',
    area: 'Finanzas',
    baseSalaryRange: new Prisma.Decimal('4500000'),
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
  };

  beforeEach(async () => {
    findMany = jest.fn().mockResolvedValue([mockPositionRow]);
    findFirst = jest.fn().mockResolvedValue(mockPositionRow);
    create = jest.fn().mockResolvedValue(mockPositionRow);
    update = jest.fn().mockResolvedValue({ ...mockPositionRow, isActive: false });
    count = jest.fn().mockResolvedValue(2);
    historyFindMany = jest.fn().mockResolvedValue([]);
    historyUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    historyCreate = jest.fn().mockResolvedValue({
      id: 'hist-1',
      tenantId,
      employeeDetailsId: 'emp-1',
      positionId: 'pos-1',
      effectiveFrom: new Date(),
      effectiveTo: null,
      changedBy: 'user-1',
      createdAt: new Date(),
    });
    supervisorFindMany = jest.fn().mockResolvedValue([]);
    supervisorDeleteMany = jest.fn().mockResolvedValue({ count: 0 });
    supervisorCreateMany = jest.fn().mockResolvedValue({ count: 0 });

    // `create`/`update` corren dentro de `$transaction(async (tx) => {...})` (OS-633): el mock
    // invoca el callback pasándole el mismo stub de Prisma, tal como en
    // `admin-roles.repository.spec.ts`. Esto permite que un mock de `tx.*` que rechaza
    // (simulando un fallo de la escritura de supervisores) haga fallar `$transaction` completo,
    // igual que ocurriría con un rollback real de Postgres.
    transaction = jest.fn().mockImplementation((arg: unknown) => {
      if (typeof arg === 'function') {
        return (arg as (tx: unknown) => Promise<unknown>)(prismaStub);
      }
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return Promise.resolve(arg);
    });

    const prismaStub = {
      employeePosition: {
        findMany,
        findFirst,
        create,
        update,
      },
      employeeDetails: {
        count,
      },
      employeePositionHistory: {
        findMany: historyFindMany,
        updateMany: historyUpdateMany,
        create: historyCreate,
      },
      employeePositionSupervisor: {
        findMany: supervisorFindMany,
        deleteMany: supervisorDeleteMany,
        createMany: supervisorCreateMany,
      },
      $transaction: transaction,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeePositionsRepository,
        {
          provide: PrismaService,
          useValue: prismaStub,
        },
      ],
    }).compile();

    repository = module.get<EmployeePositionsRepository>(EmployeePositionsRepository);
  });

  it('findAll returns active positions by default', async () => {
    const result = await repository.findAll(tenantId);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId, isActive: true },
      }),
    );
    expect(result[0].baseSalaryRange).toBe('4500000');
  });

  it('findAll includes inactive when requested', async () => {
    await repository.findAll(tenantId, { includeInactive: true });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId },
      }),
    );
  });

  it('findAll applies search filter', async () => {
    await repository.findAll(tenantId, { search: 'cont' });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.any(Array),
        }),
      }),
    );
  });

  it('findAll attaches supervisors for each position with a single batched query (no N+1)', async () => {
    findMany.mockResolvedValueOnce([
      mockPositionRow,
      { ...mockPositionRow, id: 'pos-2', title: 'Analista' },
    ]);
    supervisorFindMany.mockResolvedValue([
      {
        positionId: 'pos-1',
        supervisorPosition: { id: 'pos-boss', title: 'Gerente General' },
      },
    ]);

    const result = await repository.findAll(tenantId);

    // Un solo findMany para las posiciones y un solo findMany (batched por `positionId: { in }`)
    // para los supervisores de TODAS las posiciones devueltas — no una consulta por fila.
    expect(supervisorFindMany).toHaveBeenCalledTimes(1);
    expect(supervisorFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId, positionId: { in: ['pos-1', 'pos-2'] } },
      }),
    );
    expect(result[0].supervisors).toEqual([{ id: 'pos-boss', title: 'Gerente General' }]);
    expect(result[1].supervisors).toEqual([]);
  });

  it('findById returns null when not found', async () => {
    findFirst.mockResolvedValueOnce(null);

    const result = await repository.findById(tenantId, 'missing');

    expect(result).toBeNull();
  });

  it('findById includes supervisors', async () => {
    supervisorFindMany.mockResolvedValue([
      { positionId: 'pos-1', supervisorPosition: { id: 'pos-boss', title: 'Gerente General' } },
    ]);

    const result = await repository.findById(tenantId, 'pos-1');

    expect(result?.supervisors).toEqual([{ id: 'pos-boss', title: 'Gerente General' }]);
  });

  it('findByTitle returns mapped record with empty supervisors by default', async () => {
    const result = await repository.findByTitle(tenantId, 'Contador');

    expect(result?.title).toBe('Contador');
    expect(result?.supervisors).toEqual([]);
  });

  it('findByIds returns empty array without querying when ids is empty', async () => {
    const result = await repository.findByIds(tenantId, []);

    expect(result).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('findByIds filters by tenant and requested ids', async () => {
    await repository.findByIds(tenantId, ['pos-1', 'pos-2']);

    expect(findMany).toHaveBeenCalledWith({
      where: { tenantId, id: { in: ['pos-1', 'pos-2'] } },
    });
  });

  it('create persists the position with tenantId and empty supervisors by default', async () => {
    const result = await repository.create(tenantId, {
      title: 'Contador',
      area: 'Finanzas',
      baseSalaryRange: '4500000',
    });

    expect(transaction).toHaveBeenCalledWith(expect.any(Function));
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId, title: 'Contador' }),
      }),
    );
    expect(supervisorCreateMany).not.toHaveBeenCalled();
    expect(result.supervisors).toEqual([]);
  });

  it('create persists the position and its supervisors in the same transaction', async () => {
    await repository.create(tenantId, {
      title: 'Contador',
      area: 'Finanzas',
      baseSalaryRange: '4500000',
      supervisorPositionIds: ['pos-boss'],
    });

    expect(supervisorCreateMany).toHaveBeenCalledWith({
      data: [{ tenantId, positionId: 'pos-1', supervisorPositionId: 'pos-boss' }],
    });
  });

  it('create rolls back (rejects) when persisting supervisors fails inside the transaction', async () => {
    supervisorCreateMany.mockRejectedValueOnce(new Error('constraint violation'));

    await expect(
      repository.create(tenantId, {
        title: 'Contador',
        area: 'Finanzas',
        baseSalaryRange: '4500000',
        supervisorPositionIds: ['pos-boss'],
      }),
    ).rejects.toThrow('constraint violation');

    // La posición sí se intentó crear dentro de la transacción, pero como todo corre bajo el
    // mismo `$transaction(async (tx) => ...)`, un fallo posterior hace que la promesa completa
    // del repository rechace — el caller (service) nunca ve un resultado parcialmente creado.
    expect(create).toHaveBeenCalled();
  });

  it('update applies partial fields and attaches current supervisors when supervisorPositionIds is omitted', async () => {
    supervisorFindMany.mockResolvedValue([
      { positionId: 'pos-1', supervisorPosition: { id: 'pos-boss', title: 'Gerente General' } },
    ]);

    const result = await repository.update(tenantId, 'pos-1', { title: 'Senior Contador' });

    expect(transaction).toHaveBeenCalledWith(expect.any(Function));
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { title: 'Senior Contador' },
      }),
    );
    // Campo omitido: la relación existente no se toca.
    expect(supervisorDeleteMany).not.toHaveBeenCalled();
    expect(supervisorCreateMany).not.toHaveBeenCalled();
    expect(result.supervisors).toEqual([{ id: 'pos-boss', title: 'Gerente General' }]);
  });

  it('update replaces supervisors in the same transaction when supervisorPositionIds is provided', async () => {
    await repository.update(tenantId, 'pos-1', { supervisorPositionIds: ['pos-a', 'pos-b'] });

    expect(supervisorDeleteMany).toHaveBeenCalledWith({ where: { tenantId, positionId: 'pos-1' } });
    expect(supervisorCreateMany).toHaveBeenCalledWith({
      data: [
        { tenantId, positionId: 'pos-1', supervisorPositionId: 'pos-a' },
        { tenantId, positionId: 'pos-1', supervisorPositionId: 'pos-b' },
      ],
    });
  });

  it('update clears all supervisors when supervisorPositionIds is an empty array', async () => {
    await repository.update(tenantId, 'pos-1', { supervisorPositionIds: [] });

    expect(supervisorDeleteMany).toHaveBeenCalledWith({ where: { tenantId, positionId: 'pos-1' } });
    expect(supervisorCreateMany).not.toHaveBeenCalled();
  });

  it('update rolls back (rejects) when replacing supervisors fails inside the transaction', async () => {
    supervisorCreateMany.mockRejectedValueOnce(new Error('constraint violation'));

    await expect(
      repository.update(tenantId, 'pos-1', {
        title: 'Senior Contador',
        supervisorPositionIds: ['pos-a'],
      }),
    ).rejects.toThrow('constraint violation');

    // El campo `title` se intentó actualizar dentro de la misma transacción que los
    // supervisores; si el segundo paso falla, el rechazo se propaga completo — no queda un
    // título actualizado con supervisores a medio reemplazar.
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { title: 'Senior Contador' } }),
    );
  });

  it('deactivate sets isActive false', async () => {
    await repository.deactivate(tenantId, 'pos-1');

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isActive: false },
      }),
    );
  });

  it('countActiveEmployeesByPosition filters active employees', async () => {
    await repository.countActiveEmployeesByPosition(tenantId, 'pos-1');

    expect(count).toHaveBeenCalledWith({
      where: {
        tenantId,
        positionId: 'pos-1',
        isActive: true,
        deletedAt: null,
      },
    });
  });

  it('findSupervisorsByPositionIds returns empty map without querying when ids is empty', async () => {
    const result = await repository.findSupervisorsByPositionIds(tenantId, []);

    expect(result.size).toBe(0);
    expect(supervisorFindMany).not.toHaveBeenCalled();
  });

  it('findSupervisorsByPositionIds groups multiple supervisors per position', async () => {
    supervisorFindMany.mockResolvedValue([
      { positionId: 'pos-1', supervisorPosition: { id: 'pos-a', title: 'Director A' } },
      { positionId: 'pos-1', supervisorPosition: { id: 'pos-b', title: 'Director B' } },
    ]);

    const result = await repository.findSupervisorsByPositionIds(tenantId, ['pos-1']);

    expect(result.get('pos-1')).toEqual([
      { id: 'pos-a', title: 'Director A' },
      { id: 'pos-b', title: 'Director B' },
    ]);
  });

  it('findSubordinatePositionIds resolves transitive subordinates via BFS', async () => {
    supervisorFindMany
      .mockResolvedValueOnce([{ positionId: 'pos-child' }])
      .mockResolvedValueOnce([{ positionId: 'pos-grandchild' }])
      .mockResolvedValueOnce([]);

    const result = await repository.findSubordinatePositionIds(tenantId, 'pos-1');

    expect(result).toEqual(['pos-child', 'pos-grandchild']);
  });

  it('findHistoryByEmployee orders by effectiveFrom desc', async () => {
    await repository.findHistoryByEmployee(tenantId, 'emp-1');

    expect(historyFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { effectiveFrom: 'desc' },
      }),
    );
  });

  it('closeOpenHistory updates open records', async () => {
    const effectiveTo = new Date();
    await repository.closeOpenHistory(tenantId, 'emp-1', effectiveTo);

    expect(historyUpdateMany).toHaveBeenCalledWith({
      where: { tenantId, employeeDetailsId: 'emp-1', effectiveTo: null },
      data: { effectiveTo },
    });
  });

  it('createHistoryEntry inserts row', async () => {
    const effectiveFrom = new Date();
    await repository.createHistoryEntry({
      tenantId,
      employeeDetailsId: 'emp-1',
      positionId: 'pos-1',
      effectiveFrom,
      changedBy: 'user-1',
    });

    expect(historyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId,
          employeeDetailsId: 'emp-1',
          positionId: 'pos-1',
          changedBy: 'user-1',
        }),
      }),
    );
  });
});
