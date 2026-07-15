import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeContractType, VacationStatus, VacationType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from '../../prisma/prisma.service';
import { VacationsRepository } from '../repository/vacations.repository';

const TENANT = 'tenant-1';
const EMPLOYEE_ID = 'emp-1';

const mockBalanceRow = {
  id: 'balance-1',
  tenantId: TENANT,
  employeeId: EMPLOYEE_ID,
  accruedDays: new Decimal(15),
  takenDays: new Decimal(0),
  compensatedDays: new Decimal(0),
  lastAccrualDate: new Date('2026-07-01'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRequestRow = {
  id: 'req-1',
  tenantId: TENANT,
  employeeId: EMPLOYEE_ID,
  startDate: new Date('2026-08-01'),
  endDate: new Date('2026-08-10'),
  daysRequested: new Decimal(10),
  type: VacationType.DISFRUTE,
  status: VacationStatus.APROBADA,
  level1ApprovedBy: 'supervisor-1',
  level1ActedAt: new Date(),
  level2ApprovedBy: 'rrhh-1',
  level2ActedAt: new Date(),
  rejectionReason: null,
  letterStorageObjectId: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('VacationsRepository', () => {
  let repository: VacationsRepository;
  let prisma: {
    vacationBalance: jest.Mocked<Record<string, jest.Mock>>;
    vacationRequest: jest.Mocked<Record<string, jest.Mock>>;
    employeePositionSupervisor: jest.Mocked<Record<string, jest.Mock>>;
    employeeDetails: jest.Mocked<Record<string, jest.Mock>>;
    user: jest.Mocked<Record<string, jest.Mock>>;
  };

  beforeEach(async () => {
    prisma = {
      vacationBalance: {
        findFirst: jest.fn(),
        upsert: jest.fn(),
      },
      vacationRequest: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      employeePositionSupervisor: {
        findMany: jest.fn(),
      },
      employeeDetails: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [VacationsRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get(VacationsRepository);
  });

  describe('findBalanceByEmployee', () => {
    it('filters by tenantId and employeeId', async () => {
      // Arrange
      prisma.vacationBalance.findFirst.mockResolvedValue(mockBalanceRow);

      // Act
      const result = await repository.findBalanceByEmployee(TENANT, EMPLOYEE_ID);

      // Assert
      expect(prisma.vacationBalance.findFirst).toHaveBeenCalledWith({
        where: { tenantId: TENANT, employeeId: EMPLOYEE_ID },
      });
      expect(result?.accruedDays).toEqual(new Decimal(15));
    });
  });

  describe('findRequestById', () => {
    it('returns null when request is inactive', async () => {
      // Arrange
      prisma.vacationRequest.findFirst.mockResolvedValue(null);

      // Act
      const result = await repository.findRequestById(TENANT, 'req-inactive');

      // Assert
      expect(prisma.vacationRequest.findFirst).toHaveBeenCalledWith({
        where: { tenantId: TENANT, id: 'req-inactive', isActive: true },
      });
      expect(result).toBeNull();
    });

    it('returns mapped request when active', async () => {
      // Arrange
      prisma.vacationRequest.findFirst.mockResolvedValue(mockRequestRow);

      // Act
      const result = await repository.findRequestById(TENANT, 'req-1');

      // Assert
      expect(result?.status).toBe(VacationStatus.APROBADA);
    });
  });

  describe('findApprovedDisfruteRanges', () => {
    it('queries only DISFRUTE requests with APROBADA status', async () => {
      // Arrange
      const dateFrom = new Date('2026-08-01');
      const dateTo = new Date('2026-08-31');
      prisma.vacationRequest.findMany.mockResolvedValue([mockRequestRow]);

      // Act
      const result = await repository.findApprovedDisfruteRanges(
        TENANT,
        EMPLOYEE_ID,
        dateFrom,
        dateTo,
      );

      // Assert
      expect(prisma.vacationRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT,
            employeeId: EMPLOYEE_ID,
            type: VacationType.DISFRUTE,
            status: VacationStatus.APROBADA,
            isActive: true,
            startDate: { lte: dateTo },
            endDate: { gte: dateFrom },
          }),
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe(VacationType.DISFRUTE);
    });
  });

  // OS-591 (fase 1, cierre de hallazgos) — fuente correcta de "tomado/compensado a una
  // fecha pasada": filtra por level2ActedAt <= asOfDate, nunca por el contador mutable.
  describe('sumApprovedMovementsUpTo', (): void => {
    it('filtra por status APROBADA y level2ActedAt <= asOfDate (excluye aprobaciones futuras)', async (): Promise<void> => {
      // Arrange
      const asOfDate = new Date('2026-08-15');
      prisma.vacationRequest.findMany.mockResolvedValue([]);

      // Act
      await repository.sumApprovedMovementsUpTo(TENANT, EMPLOYEE_ID, asOfDate);

      // Assert
      expect(prisma.vacationRequest.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: TENANT,
          employeeId: EMPLOYEE_ID,
          status: VacationStatus.APROBADA,
          level2ActedAt: { lte: asOfDate },
        },
        select: { type: true, daysRequested: true },
      });
    });

    it('suma DISFRUTE en takenDays y COMPENSACION en compensatedDays por separado', async (): Promise<void> => {
      // Arrange
      prisma.vacationRequest.findMany.mockResolvedValue([
        { type: VacationType.DISFRUTE, daysRequested: new Decimal(5) },
        { type: VacationType.DISFRUTE, daysRequested: new Decimal(3) },
        { type: VacationType.COMPENSACION, daysRequested: new Decimal(2) },
      ]);

      // Act
      const result = await repository.sumApprovedMovementsUpTo(
        TENANT,
        EMPLOYEE_ID,
        new Date('2026-08-15'),
      );

      // Assert
      expect(result.takenDays.toNumber()).toBe(8);
      expect(result.compensatedDays.toNumber()).toBe(2);
    });

    it('devuelve ceros si no hay solicitudes aprobadas hasta la fecha', async (): Promise<void> => {
      prisma.vacationRequest.findMany.mockResolvedValue([]);

      const result = await repository.sumApprovedMovementsUpTo(
        TENANT,
        EMPLOYEE_ID,
        new Date('2026-08-15'),
      );

      expect(result.takenDays.toNumber()).toBe(0);
      expect(result.compensatedDays.toNumber()).toBe(0);
    });
  });

  describe('createRequest', () => {
    it('creates request with SOLICITADA status', async () => {
      // Arrange
      prisma.vacationRequest.create.mockResolvedValue({
        ...mockRequestRow,
        status: VacationStatus.SOLICITADA,
      });

      // Act
      await repository.createRequest(TENANT, {
        employeeId: EMPLOYEE_ID,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-09-05'),
        daysRequested: 5,
        type: VacationType.DISFRUTE,
      });

      // Assert
      expect(prisma.vacationRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: TENANT,
          employeeId: EMPLOYEE_ID,
          status: VacationStatus.SOLICITADA,
        }),
      });
    });
  });

  describe('findSubordinatePositionIds', () => {
    it('returns transitive subordinate position ids via BFS', async () => {
      // Arrange
      prisma.employeePositionSupervisor.findMany
        .mockResolvedValueOnce([{ positionId: 'pos-b' }])
        .mockResolvedValueOnce([{ positionId: 'pos-c' }])
        .mockResolvedValueOnce([]);

      // Act
      const result = await repository.findSubordinatePositionIds(TENANT, 'pos-a');

      // Assert
      expect(result).toEqual(['pos-b', 'pos-c']);
    });
  });

  describe('findActiveEmployeesForAccrual', () => {
    it('filters active employees by tenantId and excludes prestación contracts', async () => {
      // Arrange
      prisma.employeeDetails.findMany.mockResolvedValue([
        { id: EMPLOYEE_ID, hireDate: new Date('2024-01-01') },
      ]);

      // Act
      const result = await repository.findActiveEmployeesForAccrual(TENANT);

      // Assert
      expect(prisma.employeeDetails.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: TENANT,
          isActive: true,
          deletedAt: null,
          contractType: { not: EmployeeContractType.PRESTACION },
        },
        select: { id: true, hireDate: true },
        orderBy: { hireDate: 'asc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('upsertBalance', () => {
    it('creates balance with defaults when record does not exist', async () => {
      prisma.vacationBalance.upsert.mockResolvedValue(mockBalanceRow);

      const result = await repository.upsertBalance(TENANT, EMPLOYEE_ID, {});

      expect(prisma.vacationBalance.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            tenantId: TENANT,
            employeeId: EMPLOYEE_ID,
            accruedDays: new Decimal(0),
          }),
        }),
      );
      expect(result.employeeId).toBe(EMPLOYEE_ID);
    });

    it('updates only provided balance fields', async () => {
      prisma.vacationBalance.upsert.mockResolvedValue({
        ...mockBalanceRow,
        takenDays: new Decimal(3),
      });

      await repository.upsertBalance(TENANT, EMPLOYEE_ID, {
        takenDays: new Decimal(3),
      });

      expect(prisma.vacationBalance.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { takenDays: new Decimal(3) },
        }),
      );
    });

    it('updates accruedDays and compensatedDays when provided', async () => {
      prisma.vacationBalance.upsert.mockResolvedValue(mockBalanceRow);

      await repository.upsertBalance(TENANT, EMPLOYEE_ID, {
        accruedDays: new Decimal(20),
        compensatedDays: new Decimal(2),
        lastAccrualDate: new Date('2026-07-01'),
      });

      expect(prisma.vacationBalance.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: {
            accruedDays: new Decimal(20),
            compensatedDays: new Decimal(2),
            lastAccrualDate: new Date('2026-07-01'),
          },
        }),
      );
    });
  });

  describe('updateRequest', () => {
    it('throws when updated row belongs to another tenant', async () => {
      prisma.vacationRequest.update.mockResolvedValue({
        ...mockRequestRow,
        tenantId: 'other-tenant',
      });

      await expect(
        repository.updateRequest(TENANT, 'req-1', { status: VacationStatus.RECHAZADA }),
      ).rejects.toThrow('does not belong to tenant');
    });

    it('updates request fields for matching tenant', async () => {
      prisma.vacationRequest.update.mockResolvedValue({
        ...mockRequestRow,
        status: VacationStatus.RECHAZADA,
        rejectionReason: 'Sin cobertura',
      });

      const result = await repository.updateRequest(TENANT, 'req-1', {
        status: VacationStatus.RECHAZADA,
        rejectionReason: 'Sin cobertura',
      });

      expect(result.status).toBe(VacationStatus.RECHAZADA);
      expect(result.rejectionReason).toBe('Sin cobertura');
    });
  });

  describe('listRequests', () => {
    it('applies cursor pagination and trims extra row', async () => {
      prisma.vacationRequest.findMany.mockResolvedValue([
        mockRequestRow,
        { ...mockRequestRow, id: 'req-2' },
        { ...mockRequestRow, id: 'req-3' },
      ]);

      const result = await repository.listRequests(TENANT, {
        take: 2,
        cursor: 'cursor-1',
        employeeId: EMPLOYEE_ID,
        status: VacationStatus.APROBADA,
        dateFrom: new Date('2026-08-01'),
        dateTo: new Date('2026-08-31'),
        locationId: 'loc-1',
      });

      expect(prisma.vacationRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT,
            employeeId: EMPLOYEE_ID,
            status: VacationStatus.APROBADA,
            employee: { locationId: 'loc-1', tenantId: TENANT },
          }),
          take: 3,
          cursor: { id: 'cursor-1' },
          skip: 1,
        }),
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('listRequestSummaries', () => {
    it('maps employee and location labels from included relation', async () => {
      prisma.vacationRequest.findMany.mockResolvedValue([
        {
          ...mockRequestRow,
          employee: {
            name: 'Ana Perez',
            locationId: 'loc-1',
            location: { name: 'Sede Norte' },
          },
        },
      ]);

      const result = await repository.listRequestSummaries(TENANT, { take: 20 });

      expect(prisma.vacationRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT,
            isActive: true,
          }),
          include: expect.objectContaining({
            employee: expect.any(Object),
          }),
          take: 21,
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.employeeName).toBe('Ana Perez');
      expect(result[0]?.locationName).toBe('Sede Norte');
    });

    it('trims pagination and defaults missing employee fields', async () => {
      prisma.vacationRequest.findMany.mockResolvedValue([
        {
          ...mockRequestRow,
          id: 'req-1',
          employee: null,
        },
        {
          ...mockRequestRow,
          id: 'req-2',
          employee: {
            name: 'Luis',
            locationId: 'loc-2',
            location: null,
          },
        },
        {
          ...mockRequestRow,
          id: 'req-3',
          employee: {
            name: 'Camila',
            locationId: 'loc-3',
            location: { name: 'Sede Centro' },
          },
        },
      ]);

      const result = await repository.listRequestSummaries(TENANT, {
        take: 2,
        cursor: 'req-0',
      });

      expect(prisma.vacationRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 3,
          cursor: { id: 'req-0' },
          skip: 1,
        }),
      );
      expect(result).toHaveLength(2);
      expect(result[0]?.employeeName).toBe('');
      expect(result[0]?.locationId).toBeNull();
      expect(result[0]?.locationName).toBeNull();
      expect(result[1]?.employeeName).toBe('Luis');
      expect(result[1]?.locationName).toBeNull();
    });
  });

  describe('findApprovedDisfruteByDate', () => {
    it('returns approved disfrute range for a specific date', async () => {
      prisma.vacationRequest.findFirst.mockResolvedValue(mockRequestRow);

      const result = await repository.findApprovedDisfruteByDate(
        TENANT,
        EMPLOYEE_ID,
        new Date('2026-08-05'),
      );

      expect(result?.employeeId).toBe(EMPLOYEE_ID);
      expect(prisma.vacationRequest.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT,
            employeeId: EMPLOYEE_ID,
            type: VacationType.DISFRUTE,
            status: VacationStatus.APROBADA,
          }),
        }),
      );
    });

    it('returns null when no approved vacation exists for date', async () => {
      prisma.vacationRequest.findFirst.mockResolvedValue(null);

      const result = await repository.findApprovedDisfruteByDate(
        TENANT,
        EMPLOYEE_ID,
        new Date('2026-08-05'),
      );

      expect(result).toBeNull();
    });
  });

  describe('findEmployeeApprovalContext', () => {
    it('returns null when employee is not found', async () => {
      prisma.employeeDetails.findFirst.mockResolvedValue(null);

      const result = await repository.findEmployeeApprovalContext(TENANT, EMPLOYEE_ID);

      expect(result).toBeNull();
    });

    it('returns approval context for active employee', async () => {
      prisma.employeeDetails.findFirst.mockResolvedValue({
        userId: 'user-1',
        locationId: 'loc-1',
        positionId: 'pos-1',
      });

      const result = await repository.findEmployeeApprovalContext(TENANT, EMPLOYEE_ID);

      expect(result).toEqual({
        userId: 'user-1',
        locationId: 'loc-1',
        positionId: 'pos-1',
      });
    });
  });

  describe('findActorUser', () => {
    it('returns null when user does not exist', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      const result = await repository.findActorUser(TENANT, 'missing-user');

      expect(result).toBeNull();
    });

    it('returns role and position for existing user', async () => {
      prisma.user.findFirst.mockResolvedValue({
        role: { code: 'NOMINA' },
        employeeDetails: { positionId: 'pos-rrhh' },
      });

      const result = await repository.findActorUser(TENANT, 'user-rrhh');

      expect(result).toEqual({ roleCode: 'NOMINA', positionId: 'pos-rrhh' });
    });

    it('returns null position when user has no employee details', async () => {
      prisma.user.findFirst.mockResolvedValue({
        role: { code: 'OWNER' },
        employeeDetails: null,
      });

      const result = await repository.findActorUser(TENANT, 'user-owner');

      expect(result).toEqual({ roleCode: 'OWNER', positionId: null });
    });
  });

  describe('findEmployeeIdByUserId', () => {
    it('returns employee id when mapping exists', async () => {
      prisma.employeeDetails.findFirst.mockResolvedValue({ id: EMPLOYEE_ID });

      const result = await repository.findEmployeeIdByUserId(TENANT, 'user-1');

      expect(result).toBe(EMPLOYEE_ID);
    });

    it('returns null when mapping does not exist', async () => {
      prisma.employeeDetails.findFirst.mockResolvedValue(null);

      const result = await repository.findEmployeeIdByUserId(TENANT, 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('findEmployeeVacationProfile', () => {
    it('returns hire date and contract type for active employee', async () => {
      const hireDate = new Date('2024-01-01');
      prisma.employeeDetails.findFirst.mockResolvedValue({
        hireDate,
        contractType: EmployeeContractType.INDEFINIDO,
      });

      const result = await repository.findEmployeeVacationProfile(TENANT, EMPLOYEE_ID);

      expect(result).toEqual({
        hireDate,
        contractType: EmployeeContractType.INDEFINIDO,
      });
    });

    it('returns null when employee is not found', async () => {
      prisma.employeeDetails.findFirst.mockResolvedValue(null);

      const result = await repository.findEmployeeVacationProfile(TENANT, EMPLOYEE_ID);

      expect(result).toBeNull();
    });
  });
});
