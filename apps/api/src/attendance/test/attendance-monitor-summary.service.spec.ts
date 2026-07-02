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

const repositoryMock = {
  findLocationById: jest.fn(),
  findEmployeesAtLocation: jest.fn(),
  listHistory: jest.fn(),
  listActiveAtLocation: jest.fn(),
};

describe('AttendanceMonitorSummaryService', () => {
  let service: AttendanceMonitorSummaryService;

  beforeEach(() => {
    service = new AttendanceMonitorSummaryService(repositoryMock as never);
    jest.clearAllMocks();
    repositoryMock.findLocationById.mockResolvedValue({ id: locationId, tenantId, name: 'Sede 1' });
    repositoryMock.findEmployeesAtLocation.mockResolvedValue([employee]);
  });

  it('lanza NotFoundException si la sede no existe', async () => {
    repositoryMock.findLocationById.mockResolvedValue(null);

    await expect(
      service.getMonitorSummary({ locationId, period: 'day', anchorDate: '2026-06-18' }, tenantId),
    ).rejects.toThrow(NotFoundException);
  });

  it('clasifica ausente sin entradas en el rango', async () => {
    repositoryMock.listHistory.mockResolvedValue([]);
    repositoryMock.listActiveAtLocation.mockResolvedValue([]);

    const result = await service.getMonitorSummary(
      { locationId, period: 'day', anchorDate: '2026-06-18' },
      tenantId,
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
    );

    expect(result.isLive).toBe(true);
    expect(result.metrics.onShift).toBe(1);
    expect(result.employees.onShift[0]?.name).toBe('Carlos Mendoza');
  });
});
