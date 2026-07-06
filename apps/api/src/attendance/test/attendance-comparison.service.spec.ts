import { AttendanceEventType, DocumentType, EmployeeContractType } from '@prisma/client';
import { AttendanceComparisonService } from '../service/attendance-comparison.service';

type TestEmployee = {
  id: string;
  userId: string;
  tenantId: string;
  locationId: string;
  name: string;
  position: string;
  area: string;
  contractType: EmployeeContractType;
  user: { cedula: string; documentType: DocumentType };
  personalData: {
    nombres: string;
    primerApellido: string;
    segundoApellido: string | null;
  } | null;
  photoStorageObject: { key: string } | null;
};

const repositoryMock = {
  listActiveLocations: jest.fn(),
  listControlPanelLogs: jest.fn(),
};

const userLocationsServiceMock = {
  resolveAllowedLocationIds: jest.fn().mockResolvedValue(null),
  assertLocationAllowed: jest.fn(),
  getActiveUserLocations: jest.fn().mockResolvedValue([]),
};

const actor = { sub: 'user-1', roleCode: 'OWNER' };

const baseEmployee: TestEmployee = {
  id: 'emp-1',
  userId: 'user-1',
  tenantId: 'tenant-1',
  locationId: 'loc-1',
  name: 'Sofia Terrios',
  position: 'Cajero',
  area: 'Piso de venta',
  contractType: EmployeeContractType.INDEFINIDO,
  user: { cedula: '1013586323', documentType: DocumentType.CC },
  personalData: { nombres: 'Sofia', primerApellido: 'Terrios', segundoApellido: null },
  photoStorageObject: null,
};

function buildLog(
  overrides: Partial<{
    id: string;
    employeeId: string;
    timestamp: string;
    workDate: string;
    employee: TestEmployee;
  }> = {},
) {
  return {
    id: overrides.id ?? 'log-1',
    employeeId: overrides.employeeId ?? 'emp-1',
    locationId: 'loc-1',
    eventType: AttendanceEventType.ENTRY,
    timestamp: new Date(overrides.timestamp ?? '2026-07-01T15:00:00.000Z'),
    workDate: new Date(overrides.workDate ?? '2026-07-01T00:00:00.000Z'),
    employee: overrides.employee ?? baseEmployee,
    location: { id: 'loc-1', name: 'Gran Estación' },
  };
}

describe('AttendanceComparisonService', () => {
  let service: AttendanceComparisonService;

  beforeEach(() => {
    service = new AttendanceComparisonService(
      repositoryMock as never,
      userLocationsServiceMock as never,
    );
    jest.clearAllMocks();
    userLocationsServiceMock.resolveAllowedLocationIds.mockResolvedValue(null);
    repositoryMock.listActiveLocations.mockResolvedValue([
      { id: 'loc-1', name: 'Gran Estación', tenantId: 'tenant-1' },
    ]);
  });

  it('compara asistencias por hora entre hoy y ayer', async () => {
    repositoryMock.listControlPanelLogs.mockImplementation(async (filters) => {
      const from = filters.dateFrom?.toISOString().slice(0, 10);
      const to = filters.dateTo?.toISOString().slice(0, 10);

      if (from === '2026-06-30' && to === '2026-07-01') {
        return [
          buildLog({
            id: 'log-today',
            timestamp: '2026-07-01T15:00:00.000Z',
            workDate: '2026-07-01',
          }),
          buildLog({
            id: 'log-yesterday',
            employeeId: 'emp-2',
            timestamp: '2026-06-30T15:00:00.000Z',
            workDate: '2026-06-30',
            employee: { ...baseEmployee, id: 'emp-2', userId: 'user-2' },
          }),
        ];
      }

      return [];
    });

    const result = await service.getComparison(
      'tenant-1',
      {
        anchorDate: '2026-07-01',
        period: 'day',
      },
      actor,
    );

    expect(result.period).toBe('day');
    expect(result.series.current.name).toBe('Hoy');
    expect(result.series.previous.name).toBe('Ayer');
    expect(result.points).toHaveLength(24);

    const hour10 = result.points.find((point) => point.bucketKey === '10');
    expect(hour10?.current).toBe(1);
    expect(hour10?.previous).toBe(1);
  });

  it('compara asistencias por día en periodo semanal', async () => {
    repositoryMock.listControlPanelLogs.mockResolvedValue([
      buildLog({ id: 'log-mon', timestamp: '2026-06-30T12:00:00.000Z', workDate: '2026-06-30' }),
      buildLog({
        id: 'log-prev-mon',
        employeeId: 'emp-2',
        timestamp: '2026-06-23T12:00:00.000Z',
        workDate: '2026-06-23',
        employee: { ...baseEmployee, id: 'emp-2', userId: 'user-2' },
      }),
      buildLog({ id: 'log-wed', timestamp: '2026-07-02T12:00:00.000Z', workDate: '2026-07-02' }),
    ]);

    const result = await service.getComparison(
      'tenant-1',
      {
        anchorDate: '2026-07-01',
        period: 'week',
      },
      actor,
    );

    expect(result.period).toBe('week');
    expect(result.series.current.name).toContain('Semana');
    expect(result.series.previous.name).toContain('Semana');
    expect(result.points).toHaveLength(7);
    expect(result.points[0]?.label).toContain('Lun');
    expect(result.points.some((point) => point.current === 1)).toBe(true);
    expect(result.points.some((point) => point.previous === 1)).toBe(true);
  });

  it('compara asistencias por día en periodo mensual', async () => {
    repositoryMock.listControlPanelLogs.mockResolvedValue([
      buildLog({ id: 'log-jul', timestamp: '2026-07-05T12:00:00.000Z', workDate: '2026-07-05' }),
      buildLog({
        id: 'log-jun',
        employeeId: 'emp-2',
        timestamp: '2026-06-05T12:00:00.000Z',
        workDate: '2026-06-05',
        employee: { ...baseEmployee, id: 'emp-2', userId: 'user-2' },
      }),
    ]);

    const result = await service.getComparison(
      'tenant-1',
      {
        anchorDate: '2026-07-01',
        period: 'month',
      },
      actor,
    );

    expect(result.period).toBe('month');
    expect(result.series.current.name).toContain('Mes');
    expect(result.series.previous.name).toContain('Mes');
    expect(result.points.length).toBeGreaterThan(0);
    expect(result.points.some((point) => point.current === 1)).toBe(true);
    expect(result.points.some((point) => point.previous === 1)).toBe(true);
  });

  it('aplica filtros de sede, área, contrato y búsqueda', async () => {
    repositoryMock.listActiveLocations.mockResolvedValue([
      { id: 'loc-1', name: 'Gran Estación', tenantId: 'tenant-1' },
    ]);
    repositoryMock.listControlPanelLogs.mockResolvedValue([
      buildLog({
        employee: {
          ...baseEmployee,
          area: 'Cocina',
          contractType: EmployeeContractType.FIJO,
          name: 'Ana Perez',
          personalData: { nombres: 'Ana', primerApellido: 'Perez', segundoApellido: null },
          user: { cedula: '99887766', documentType: DocumentType.CC },
        },
      }),
      buildLog({
        id: 'log-other',
        employeeId: 'emp-2',
        employee: {
          ...baseEmployee,
          id: 'emp-2',
          userId: 'user-2',
          area: 'Piso de venta',
          contractType: EmployeeContractType.INDEFINIDO,
        },
      }),
    ]);

    const result = await service.getComparison(
      'tenant-1',
      {
        anchorDate: '2026-07-01',
        period: 'day',
        locationId: 'loc-1',
        area: 'Cocina',
        contractType: EmployeeContractType.FIJO,
        search: 'ana',
      },
      actor,
    );

    expect(repositoryMock.listActiveLocations).toHaveBeenCalledWith('tenant-1', ['loc-1']);
    const totalCurrent = result.points.reduce((sum, point) => sum + point.current, 0);
    expect(totalCurrent).toBe(1);
  });

  it('excluye empleados que no coinciden con la búsqueda', async () => {
    repositoryMock.listControlPanelLogs.mockResolvedValue([buildLog()]);

    const result = await service.getComparison(
      'tenant-1',
      {
        anchorDate: '2026-07-01',
        period: 'day',
        search: 'inexistente',
      },
      actor,
    );

    const totalCurrent = result.points.reduce((sum, point) => sum + point.current, 0);
    expect(totalCurrent).toBe(0);
  });
});
