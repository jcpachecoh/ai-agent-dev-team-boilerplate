import { Test, type TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { AttendanceCollaboratorsRepository } from '../repository/attendance-collaborators.repository';

const TENANT = 'tenant-1';

function buildRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'emp-1',
    userId: 'user-1',
    locationId: 'loc-1',
    name: 'Ana Pérez',
    area: 'Cocina',
    positionId: 'pos-1',
    position: 'Cocinero',
    contractType: 'INDEFINIDO',
    laborClassification: 'COCINA',
    isActive: true,
    portalWorkerEnabled: false,
    location: { name: 'Sede Norte' },
    personalData: { primerApellido: 'Pérez', segundoApellido: 'Gómez' },
    user: { cedula: '123456', email: 'ana@example.com' },
    ...overrides,
  };
}

describe('AttendanceCollaboratorsRepository', () => {
  let repository: AttendanceCollaboratorsRepository;
  let prisma: {
    employeeDetails: {
      count: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    userLocation: { findMany: jest.Mock };
    turnoAssignment: { findMany: jest.Mock };
    user: { findFirst: jest.Mock; findMany: jest.Mock };
    $queryRaw: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      employeeDetails: {
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      userLocation: { findMany: jest.fn() },
      turnoAssignment: { findMany: jest.fn() },
      user: { findFirst: jest.fn(), findMany: jest.fn() },
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AttendanceCollaboratorsRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get(AttendanceCollaboratorsRepository);
  });

  describe('findPage', () => {
    it('filtra siempre por tenantId y deletedAt:null, sin restringir isActive cuando status=all', async () => {
      prisma.employeeDetails.count.mockResolvedValue(0);
      prisma.employeeDetails.findMany.mockResolvedValue([]);

      await repository.findPage({
        tenantId: TENANT,
        page: 1,
        pageSize: 20,
        allowedLocationIds: null,
      });

      const where = prisma.employeeDetails.count.mock.calls[0][0].where;
      expect(where).toEqual({ tenantId: TENANT, deletedAt: null });
    });

    it('status=active agrega isActive:true; status=inactive agrega isActive:false', async () => {
      prisma.employeeDetails.count.mockResolvedValue(0);
      prisma.employeeDetails.findMany.mockResolvedValue([]);

      await repository.findPage({
        tenantId: TENANT,
        status: 'active',
        page: 1,
        pageSize: 20,
        allowedLocationIds: null,
      });
      expect(prisma.employeeDetails.count.mock.calls[0][0].where.isActive).toBe(true);

      prisma.employeeDetails.count.mockClear();
      await repository.findPage({
        tenantId: TENANT,
        status: 'inactive',
        page: 1,
        pageSize: 20,
        allowedLocationIds: null,
      });
      expect(prisma.employeeDetails.count.mock.calls[0][0].where.isActive).toBe(false);
    });

    it('mapea laborClassification=administrativo a ADMINISTRATIVO y operaciones a IN[COCINA,SERVICIO]', async () => {
      prisma.employeeDetails.count.mockResolvedValue(0);
      prisma.employeeDetails.findMany.mockResolvedValue([]);

      await repository.findPage({
        tenantId: TENANT,
        laborClassification: 'administrativo',
        page: 1,
        pageSize: 20,
        allowedLocationIds: null,
      });
      expect(prisma.employeeDetails.count.mock.calls[0][0].where.laborClassification).toBe(
        'ADMINISTRATIVO',
      );

      prisma.employeeDetails.count.mockClear();
      await repository.findPage({
        tenantId: TENANT,
        laborClassification: 'operaciones',
        page: 1,
        pageSize: 20,
        allowedLocationIds: null,
      });
      expect(prisma.employeeDetails.count.mock.calls[0][0].where.laborClassification).toEqual({
        in: ['COCINA', 'SERVICIO'],
      });
    });

    it('positionId/contractType/area se aplican directamente al where', async () => {
      prisma.employeeDetails.count.mockResolvedValue(0);
      prisma.employeeDetails.findMany.mockResolvedValue([]);

      await repository.findPage({
        tenantId: TENANT,
        positionId: 'pos-1',
        contractType: 'INDEFINIDO' as never,
        area: 'Cocina',
        page: 1,
        pageSize: 20,
        allowedLocationIds: null,
      });

      const where = prisma.employeeDetails.count.mock.calls[0][0].where;
      expect(where.positionId).toBe('pos-1');
      expect(where.contractType).toBe('INDEFINIDO');
      expect(where.area).toBe('Cocina');
    });

    it('sin locationId explícito, usa allowedLocationIds del scope tal cual', async () => {
      prisma.employeeDetails.count.mockResolvedValue(0);
      prisma.employeeDetails.findMany.mockResolvedValue([]);

      await repository.findPage({
        tenantId: TENANT,
        page: 1,
        pageSize: 20,
        allowedLocationIds: ['loc-1', 'loc-2'],
      });

      expect(prisma.employeeDetails.count.mock.calls[0][0].where.locationId).toEqual({
        in: ['loc-1', 'loc-2'],
      });
    });

    it('locationId explícito dentro del scope se respeta como único valor', async () => {
      prisma.employeeDetails.count.mockResolvedValue(0);
      prisma.employeeDetails.findMany.mockResolvedValue([]);

      await repository.findPage({
        tenantId: TENANT,
        locationId: 'loc-2',
        page: 1,
        pageSize: 20,
        allowedLocationIds: ['loc-1', 'loc-2'],
      });

      expect(prisma.employeeDetails.count.mock.calls[0][0].where.locationId).toEqual({
        in: ['loc-2'],
      });
    });

    it('locationId explícito fuera del scope devuelve 0 filas sin consultar Prisma', async () => {
      const result = await repository.findPage({
        tenantId: TENANT,
        locationId: 'loc-9',
        page: 1,
        pageSize: 20,
        allowedLocationIds: ['loc-1', 'loc-2'],
      });

      expect(result).toEqual({ items: [], total: 0, activeTotal: 0, inactiveTotal: 0 });
      expect(prisma.employeeDetails.count).not.toHaveBeenCalled();
    });

    it('con search, usa los ids resueltos por $queryRaw como filtro id:{in}', async () => {
      prisma.$queryRaw.mockResolvedValue([{ id: 'emp-1' }, { id: 'emp-2' }]);
      prisma.employeeDetails.count.mockResolvedValue(2);
      prisma.employeeDetails.findMany.mockResolvedValue([buildRow()]);

      await repository.findPage({
        tenantId: TENANT,
        search: 'José',
        page: 1,
        pageSize: 20,
        allowedLocationIds: null,
      });

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(prisma.employeeDetails.count.mock.calls[0][0].where.id).toEqual({
        in: ['emp-1', 'emp-2'],
      });
    });

    it('con search sin coincidencias, devuelve 0 filas sin consultar employeeDetails', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      const result = await repository.findPage({
        tenantId: TENANT,
        search: 'inexistente',
        page: 1,
        pageSize: 20,
        allowedLocationIds: null,
      });

      expect(result).toEqual({ items: [], total: 0, activeTotal: 0, inactiveTotal: 0 });
      expect(prisma.employeeDetails.count).not.toHaveBeenCalled();
    });

    it('activeTotal/inactiveTotal reflejan el mismo where + isActive forzado, no la página actual', async () => {
      prisma.employeeDetails.count
        .mockResolvedValueOnce(45) // total
        .mockResolvedValueOnce(40) // activeTotal
        .mockResolvedValueOnce(5); // inactiveTotal
      prisma.employeeDetails.findMany.mockResolvedValue([buildRow()]);

      const result = await repository.findPage({
        tenantId: TENANT,
        page: 1,
        pageSize: 20,
        allowedLocationIds: null,
      });

      expect(result).toMatchObject({ total: 45, activeTotal: 40, inactiveTotal: 5 });
      expect(prisma.employeeDetails.count).toHaveBeenCalledTimes(3);
      expect(prisma.employeeDetails.count.mock.calls[1][0].where).toEqual(
        expect.objectContaining({ isActive: true }),
      );
      expect(prisma.employeeDetails.count.mock.calls[2][0].where).toEqual(
        expect.objectContaining({ isActive: false }),
      );
    });

    it('mapea correctamente los campos de EmployeeDetails a CollaboratorRecord', async () => {
      prisma.employeeDetails.count.mockResolvedValue(1);
      prisma.employeeDetails.findMany.mockResolvedValue([buildRow()]);

      const result = await repository.findPage({
        tenantId: TENANT,
        page: 1,
        pageSize: 20,
        allowedLocationIds: null,
      });

      expect(result.total).toBe(1);
      expect(result.items[0]).toEqual({
        id: 'emp-1',
        userId: 'user-1',
        locationId: 'loc-1',
        locationName: 'Sede Norte',
        name: 'Ana Pérez',
        primerApellido: 'Pérez',
        segundoApellido: 'Gómez',
        cedula: '123456',
        email: 'ana@example.com',
        positionId: 'pos-1',
        positionName: 'Cocinero',
        area: 'Cocina',
        contractType: 'INDEFINIDO',
        laborClassification: 'COCINA',
        isActive: true,
        portalWorkerEnabled: false,
      });
    });

    it('sin sortBy, ordena por createdAt desc (default)', async () => {
      prisma.employeeDetails.count.mockResolvedValue(0);
      prisma.employeeDetails.findMany.mockResolvedValue([]);

      await repository.findPage({
        tenantId: TENANT,
        page: 1,
        pageSize: 20,
        allowedLocationIds: null,
      });

      expect(prisma.employeeDetails.findMany.mock.calls[0][0].orderBy).toEqual({
        createdAt: 'desc',
      });
    });

    it.each([
      ['employee', 'name'],
      ['role', 'position'],
      ['hireDate', 'hireDate'],
    ])('sortBy=%s ordena por %s con la dirección pedida', async (sortBy, field) => {
      prisma.employeeDetails.count.mockResolvedValue(0);
      prisma.employeeDetails.findMany.mockResolvedValue([]);

      await repository.findPage({
        tenantId: TENANT,
        sortBy: sortBy as never,
        sortDir: 'desc',
        page: 1,
        pageSize: 20,
        allowedLocationIds: null,
      });

      expect(prisma.employeeDetails.findMany.mock.calls[0][0].orderBy).toEqual({
        [field]: 'desc',
      });
    });

    it('sortBy sin sortDir explícito usa asc por default', async () => {
      prisma.employeeDetails.count.mockResolvedValue(0);
      prisma.employeeDetails.findMany.mockResolvedValue([]);

      await repository.findPage({
        tenantId: TENANT,
        sortBy: 'employee',
        page: 1,
        pageSize: 20,
        allowedLocationIds: null,
      });

      expect(prisma.employeeDetails.findMany.mock.calls[0][0].orderBy).toEqual({ name: 'asc' });
    });

    it('maneja personalData/location ausentes con null', async () => {
      prisma.employeeDetails.count.mockResolvedValue(1);
      prisma.employeeDetails.findMany.mockResolvedValue([
        buildRow({ personalData: null, location: null }),
      ]);

      const result = await repository.findPage({
        tenantId: TENANT,
        page: 1,
        pageSize: 20,
        allowedLocationIds: null,
      });

      expect(result.items[0].primerApellido).toBeNull();
      expect(result.items[0].segundoApellido).toBeNull();
      expect(result.items[0].locationName).toBeNull();
    });
  });

  describe('findSupervisorsForLocations', () => {
    it('devuelve mapa vacío si no hay locationIds', async () => {
      const result = await repository.findSupervisorsForLocations(TENANT, []);
      expect(result.size).toBe(0);
      expect(prisma.userLocation.findMany).not.toHaveBeenCalled();
    });

    it('agrupa supervisores por locationId en una sola query batched', async () => {
      prisma.userLocation.findMany.mockResolvedValue([
        {
          locationId: 'loc-1',
          user: { id: 'sup-1', email: 'sup1@example.com', employeeDetails: { name: 'Sup Uno' } },
        },
        {
          locationId: 'loc-1',
          user: { id: 'sup-2', email: 'sup2@example.com', employeeDetails: null },
        },
        {
          locationId: 'loc-2',
          user: { id: 'sup-3', email: 'sup3@example.com', employeeDetails: null },
        },
      ]);

      const result = await repository.findSupervisorsForLocations(TENANT, ['loc-1', 'loc-2']);

      expect(prisma.userLocation.findMany).toHaveBeenCalledTimes(1);
      expect(result.get('loc-1')).toEqual([
        { id: 'sup-1', name: 'Sup Uno', email: 'sup1@example.com' },
        { id: 'sup-2', name: 'sup2@example.com', email: 'sup2@example.com' },
      ]);
      expect(result.get('loc-2')).toEqual([
        { id: 'sup-3', name: 'sup3@example.com', email: 'sup3@example.com' },
      ]);
    });
  });

  describe('findTodayAssignments', () => {
    it('devuelve mapa vacío si no hay employeeIds', async () => {
      const result = await repository.findTodayAssignments(TENANT, [], new Date());
      expect(result.size).toBe(0);
      expect(prisma.turnoAssignment.findMany).not.toHaveBeenCalled();
    });

    it('mapea REST sin turno y ASSIGNED con turno', async () => {
      prisma.turnoAssignment.findMany.mockResolvedValue([
        { employeeId: 'emp-1', type: 'REST', turno: null },
        {
          employeeId: 'emp-2',
          type: 'ASSIGNED',
          turno: {
            id: 'turno-1',
            nombre: 'Mañana',
            sigla: 'TM',
            horaInicio: '06:00',
            horaFin: '14:00',
            jornada: 'DIURNO',
          },
        },
      ]);

      const result = await repository.findTodayAssignments(
        TENANT,
        ['emp-1', 'emp-2', 'emp-3'],
        new Date('2026-07-06T00:00:00.000Z'),
      );

      expect(result.get('emp-1')).toEqual({ type: 'REST', turno: null });
      expect(result.get('emp-2')).toEqual({
        type: 'ASSIGNED',
        turno: {
          id: 'turno-1',
          nombre: 'Mañana',
          sigla: 'TM',
          horaInicio: '06:00',
          horaFin: '14:00',
          jornada: 'DIURNO',
        },
      });
      expect(result.has('emp-3')).toBe(false);
    });
  });

  describe('findSupervisorUser', () => {
    it('devuelve id + roleCode cuando el usuario existe', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'sup-1', role: { code: 'SUPERVISOR' } });
      const result = await repository.findSupervisorUser(TENANT, 'sup-1');
      expect(result).toEqual({ id: 'sup-1', roleCode: 'SUPERVISOR' });
    });

    it('devuelve null cuando el usuario no existe en el tenant', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      const result = await repository.findSupervisorUser(TENANT, 'ghost');
      expect(result).toBeNull();
    });
  });

  describe('findSupervisorOptions', () => {
    it('sin allowedLocationIds, no agrega filtro de userLocations', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      await repository.findSupervisorOptions(TENANT, null);
      expect(prisma.user.findMany.mock.calls[0][0].where.userLocations).toBeUndefined();
    });

    it('con allowedLocationIds, filtra por userLocations.some', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      await repository.findSupervisorOptions(TENANT, ['loc-1']);
      expect(prisma.user.findMany.mock.calls[0][0].where.userLocations).toEqual({
        some: { locationId: { in: ['loc-1'] } },
      });
    });
  });

  describe('findEmployeeForPortalToggle', () => {
    it('devuelve id + portalWorkerEnabled cuando el empleado existe en el tenant', async () => {
      prisma.employeeDetails.findFirst.mockResolvedValue({
        id: 'emp-1',
        portalWorkerEnabled: true,
      });

      const result = await repository.findEmployeeForPortalToggle(TENANT, 'emp-1');

      expect(prisma.employeeDetails.findFirst).toHaveBeenCalledWith({
        where: { id: 'emp-1', tenantId: TENANT, deletedAt: null },
        select: { id: true, portalWorkerEnabled: true },
      });
      expect(result).toEqual({ id: 'emp-1', portalWorkerEnabled: true });
    });

    it('devuelve null cuando el empleado no existe en el tenant', async () => {
      prisma.employeeDetails.findFirst.mockResolvedValue(null);
      const result = await repository.findEmployeeForPortalToggle(TENANT, 'ghost');
      expect(result).toBeNull();
    });
  });

  describe('updatePortalWorkerEnabled', () => {
    it('actualiza portalWorkerEnabled por id', async () => {
      prisma.employeeDetails.update.mockResolvedValue({});
      await repository.updatePortalWorkerEnabled('emp-1', true);
      expect(prisma.employeeDetails.update).toHaveBeenCalledWith({
        where: { id: 'emp-1' },
        data: { portalWorkerEnabled: true },
      });
    });
  });
});
