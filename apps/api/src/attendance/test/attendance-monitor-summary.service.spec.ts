import { NotFoundException } from '@nestjs/common';
import {
  AttendanceEventType,
  AttendanceShift,
  CostCenter,
  DocumentType,
  LaborClassification,
} from '@prisma/client';
import { AttendanceMonitorSummaryService } from '../service/attendance-monitor-summary.service';
import type { EmployeeWithUser } from '../interfaces/attendance.interfaces';

const tenantId = 'tenant-1';
const locationId = 'loc-1';

const employee: EmployeeWithUser = {
  id: 'emp-1',
  userId: 'user-1',
  tenantId,
  locationId,
  name: 'Carlos Mendoza',
  positionId: null,
  position: 'Parrillero',
  area: 'Cocina',
  department: 'Operaciones',
  contractType: 'INDEFINIDO',
  hireDate: new Date('2024-01-01'),
  contractStart: new Date('2024-01-01'),
  contractEnd: null,
  salaryType: 'ORDINARIO',
  salaryAmount: 2000000 as never,
  hasTransportSubsidy: true,
  isExemptFromTax: false,
  epsName: 'EPS',
  pensionFundName: 'Pension',
  cesantiasFundName: 'Cesantias',
  arlName: 'ARL',
  arlRiskLevel: 'RIESGO_I',
  cajaCompensacion: 'Caja',
  barrio: null,
  localidad: null,
  costCenter: CostCenter.OPERACIONES,
  laborClassification: LaborClassification.COCINA,
  nonSalaryAmount: null,
  pinHash: null,
  photoStorageObjectId: null,
  portalWorkerEnabled: false,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  user: {
    id: 'user-1',
    email: 'carlos@example.com',
    cedula: '123',
    documentType: DocumentType.CC,
    tenantId,
    isActive: true,
    emailVerified: false,
    loginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    passwordChangedAt: null,
    refreshToken: null,
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    passwordHash: 'hash',
    roleId: 'role-1',
  },
};

const defaultClasificacionCounts = { cocina: 2, servicio: 3, administrativo: 1 };

const actor = { sub: 'actor-1', roleCode: 'OWNER' };

const repositoryMock = {
  findLocationById: jest.fn(),
  findEmployeesAtLocation: jest.fn(),
  listHistory: jest.fn(),
  listActiveAtLocation: jest.fn(),
  countByLaborClassification: jest.fn(),
};

const userLocationsServiceMock = {
  resolveAllowedLocationIds: jest.fn().mockResolvedValue(null),
  assertLocationAllowed: jest.fn(),
};

describe('AttendanceMonitorSummaryService', () => {
  let service: AttendanceMonitorSummaryService;

  beforeEach(() => {
    service = new AttendanceMonitorSummaryService(
      repositoryMock as never,
      userLocationsServiceMock as never,
      { getValueAt: jest.fn().mockResolvedValue(21) } as never,
    );
    jest.clearAllMocks();
    userLocationsServiceMock.resolveAllowedLocationIds.mockResolvedValue(null);
    repositoryMock.findLocationById.mockResolvedValue({ id: locationId, tenantId, name: 'Sede 1' });
    repositoryMock.findEmployeesAtLocation.mockResolvedValue([employee]);
    repositoryMock.listHistory.mockResolvedValue([]);
    repositoryMock.listActiveAtLocation.mockResolvedValue([]);
    repositoryMock.countByLaborClassification.mockResolvedValue(defaultClasificacionCounts);
  });

  it('lanza NotFoundException si la sede no existe', async () => {
    repositoryMock.findLocationById.mockResolvedValue(null);

    await expect(
      service.getMonitorSummary(
        { locationId, period: 'day', anchorDate: '2026-06-18' },
        tenantId,
        actor,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('clasifica ausente sin entradas en el rango', async () => {
    repositoryMock.listHistory.mockResolvedValue([]);
    repositoryMock.listActiveAtLocation.mockResolvedValue([]);

    const result = await service.getMonitorSummary(
      { locationId, period: 'day', anchorDate: '2026-06-18' },
      tenantId,
      actor,
    );

    expect(result.metrics.absent).toBe(1);
    expect(result.employees.absent).toHaveLength(1);
    expect(result.employees.onShift).toHaveLength(0);
  });

  it('clasifica en turno cuando hay entrada activa hoy', async () => {
    const entryTimestamp = new Date('2026-06-18T13:10:00.000Z');
    repositoryMock.listHistory.mockResolvedValue([
      {
        id: 'log-1',
        tenantId,
        employeeId: employee.id,
        locationId,
        eventType: AttendanceEventType.ENTRY,
        shift: AttendanceShift.MORNING,
        timestamp: entryTimestamp,
        workDate: new Date('2026-06-18T00:00:00.000Z'),
        notes: null,
        isActive: true,
        createdAt: entryTimestamp,
        updatedAt: entryTimestamp,
        employee,
      },
    ]);
    repositoryMock.listActiveAtLocation.mockResolvedValue([
      {
        id: 'log-1',
        tenantId,
        employeeId: employee.id,
        locationId,
        eventType: AttendanceEventType.ENTRY,
        shift: AttendanceShift.MORNING,
        timestamp: entryTimestamp,
        workDate: new Date('2026-06-18T00:00:00.000Z'),
        notes: null,
        isActive: true,
        createdAt: entryTimestamp,
        updatedAt: entryTimestamp,
        employee,
        location: { id: locationId, name: 'Sede 1' },
      },
    ]);

    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const result = await service.getMonitorSummary(
      { locationId, period: 'day', anchorDate: today },
      tenantId,
      actor,
    );

    expect(result.isLive).toBe(true);
    expect(result.metrics.onShift).toBe(1);
    expect(result.employees.onShift[0]?.name).toBe('Carlos Mendoza');
  });

  it('clasifica tardanzas y horas extra en periodo histórico', async () => {
    repositoryMock.listHistory.mockResolvedValue([
      {
        id: 'log-late',
        tenantId,
        employeeId: employee.id,
        locationId,
        eventType: AttendanceEventType.ENTRY,
        shift: AttendanceShift.MORNING,
        timestamp: new Date('2026-06-10T15:00:00.000Z'),
        workDate: new Date('2026-06-10T00:00:00.000Z'),
        notes: null,
        isActive: true,
        createdAt: new Date('2026-06-10T15:00:00.000Z'),
        updatedAt: new Date('2026-06-10T15:00:00.000Z'),
        employee,
      },
      {
        id: 'log-exit',
        tenantId,
        employeeId: employee.id,
        locationId,
        eventType: AttendanceEventType.EXIT,
        shift: AttendanceShift.MORNING,
        timestamp: new Date('2026-06-10T23:30:00.000Z'),
        workDate: new Date('2026-06-10T00:00:00.000Z'),
        notes: null,
        isActive: true,
        createdAt: new Date('2026-06-10T23:30:00.000Z'),
        updatedAt: new Date('2026-06-10T23:30:00.000Z'),
        employee,
      },
    ]);
    repositoryMock.listActiveAtLocation.mockResolvedValue([]);

    const result = await service.getMonitorSummary(
      { locationId, period: 'week', anchorDate: '2026-06-10' },
      tenantId,
      actor,
    );

    expect(result.isLive).toBe(false);
    expect(result.metrics.lateArrivals).toBe(1);
    expect(result.metrics.overtime).toBe(1);
    expect(result.employees.late[0]?.lateMinutes).toBeGreaterThan(0);
  });

  it('usa el email cuando el empleado no tiene nombre', async () => {
    // Arrange
    const unnamedEmployee = { ...employee, name: '   ' };
    repositoryMock.findEmployeesAtLocation.mockResolvedValue([unnamedEmployee]);

    // Act
    const result = await service.getMonitorSummary(
      { locationId, period: 'day', anchorDate: '2026-06-18' },
      tenantId,
      actor,
    );

    // Assert
    expect(result.employees.absent[0]?.name).toBe('carlos');
  });

  describe('filtro clasificacion', () => {
    it('sin clasificacion llama findEmployeesAtLocation sin filtro', async () => {
      // Arrange & Act
      await service.getMonitorSummary(
        { locationId, period: 'day', anchorDate: '2026-06-18' },
        tenantId,
        actor,
      );

      // Assert
      expect(repositoryMock.findEmployeesAtLocation).toHaveBeenCalledWith(
        locationId,
        tenantId,
        undefined,
      );
    });

    it('clasificacion=todos llama findEmployeesAtLocation sin filtro', async () => {
      // Arrange & Act
      await service.getMonitorSummary(
        { locationId, period: 'day', anchorDate: '2026-06-18', clasificacion: 'todos' },
        tenantId,
        actor,
      );

      // Assert
      expect(repositoryMock.findEmployeesAtLocation).toHaveBeenCalledWith(
        locationId,
        tenantId,
        undefined,
      );
    });

    it('clasificacion=administrativo filtra por [ADMINISTRATIVO]', async () => {
      // Arrange & Act
      await service.getMonitorSummary(
        { locationId, period: 'day', anchorDate: '2026-06-18', clasificacion: 'administrativo' },
        tenantId,
        actor,
      );

      // Assert
      expect(repositoryMock.findEmployeesAtLocation).toHaveBeenCalledWith(locationId, tenantId, [
        LaborClassification.ADMINISTRATIVO,
      ]);
    });

    it('clasificacion=operaciones filtra por [COCINA, SERVICIO]', async () => {
      // Arrange & Act
      await service.getMonitorSummary(
        { locationId, period: 'day', anchorDate: '2026-06-18', clasificacion: 'operaciones' },
        tenantId,
        actor,
      );

      // Assert
      expect(repositoryMock.findEmployeesAtLocation).toHaveBeenCalledWith(locationId, tenantId, [
        LaborClassification.COCINA,
        LaborClassification.SERVICIO,
      ]);
    });

    it('siempre llama countByLaborClassification independientemente del filtro activo', async () => {
      // Arrange & Act
      await service.getMonitorSummary(
        { locationId, period: 'day', anchorDate: '2026-06-18', clasificacion: 'administrativo' },
        tenantId,
        actor,
      );

      // Assert
      expect(repositoryMock.countByLaborClassification).toHaveBeenCalledWith(locationId, tenantId);
    });

    it('incluye clasificacionCounts en el response con valores del repositorio', async () => {
      // Arrange & Act
      const result = await service.getMonitorSummary(
        { locationId, period: 'day', anchorDate: '2026-06-18' },
        tenantId,
        actor,
      );

      // Assert
      expect(result.clasificacionCounts).toEqual(defaultClasificacionCounts);
    });

    it('refleja el clasificacion activo en el response', async () => {
      // Arrange & Act
      const result = await service.getMonitorSummary(
        { locationId, period: 'day', anchorDate: '2026-06-18', clasificacion: 'operaciones' },
        tenantId,
        actor,
      );

      // Assert
      expect(result.clasificacion).toBe('operaciones');
    });

    it('metrics.total refleja el subconjunto filtrado devuelto por el repositorio', async () => {
      // Arrange — simula que el repositorio devuelve solo el empleado administrativo
      repositoryMock.findEmployeesAtLocation.mockResolvedValue([employee]);

      // Act
      const result = await service.getMonitorSummary(
        { locationId, period: 'day', anchorDate: '2026-06-18', clasificacion: 'administrativo' },
        tenantId,
        actor,
      );

      // Assert
      expect(result.metrics.total).toBe(1);
    });
  });
});
