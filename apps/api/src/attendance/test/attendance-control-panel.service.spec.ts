import { AttendanceEventType, DocumentType, EmployeeContractType } from '@prisma/client';
import { AttendanceControlPanelService } from '../service/attendance-control-panel.service';

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
  findTenantLabel: jest.fn(),
  listActiveLocations: jest.fn(),
  listControlPanelLogs: jest.fn(),
  listMobileLogsForDay: jest.fn(),
  listMobileLogsForRange: jest.fn(),
};

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
    eventType: AttendanceEventType;
    timestamp: string;
    workDate: string;
    employee: TestEmployee;
  }> = {},
) {
  return {
    id: overrides.id ?? 'log-1',
    employeeId: overrides.employeeId ?? 'emp-1',
    locationId: 'loc-1',
    eventType: overrides.eventType ?? AttendanceEventType.ENTRY,
    timestamp: new Date(overrides.timestamp ?? '2026-07-01T17:07:45.000Z'),
    workDate: new Date(overrides.workDate ?? '2026-07-01T00:00:00.000Z'),
    employee: overrides.employee ?? baseEmployee,
    location: { id: 'loc-1', name: 'Gran Estación' },
  };
}

describe('AttendanceControlPanelService', () => {
  let service: AttendanceControlPanelService;
  const originalPublicDomain = process.env.R2_PUBLIC_DOMAIN;

  beforeEach(() => {
    service = new AttendanceControlPanelService(repositoryMock as never);
    jest.clearAllMocks();
    delete process.env.R2_PUBLIC_DOMAIN;
    repositoryMock.findTenantLabel.mockResolvedValue('INVERSIONES LLANES S.A.S');
    repositoryMock.listActiveLocations.mockResolvedValue([
      { id: 'loc-1', name: 'Gran Estación', tenantId: 'tenant-1' },
    ]);
    repositoryMock.listMobileLogsForDay.mockResolvedValue([]);
    repositoryMock.listMobileLogsForRange.mockResolvedValue([]);
  });

  afterEach(() => {
    if (originalPublicDomain === undefined) {
      delete process.env.R2_PUBLIC_DOMAIN;
    } else {
      process.env.R2_PUBLIC_DOMAIN = originalPublicDomain;
    }
  });

  it('consolida indicadores y línea de tiempo del día', async () => {
    repositoryMock.listControlPanelLogs.mockImplementation(async (filters) => {
      if (filters.dateFrom?.toISOString().startsWith('2026-07-01')) {
        return [buildLog()];
      }
      return [];
    });

    const result = await service.getControlPanel('tenant-1', {
      anchorDate: '2026-07-01',
      page: 1,
      pageSize: 20,
    });

    expect(result.metrics.workingNow).toBe(1);
    expect(result.metrics.attendanceToday).toBe(1);
    expect(result.period).toBe('day');
    expect(result.tenantName).toBe('INVERSIONES LLANES S.A.S');
    expect(result.timeline.items).toHaveLength(1);
    expect(result.timeline.items[0]?.documentNumber).toBe('1013586323');
    expect(result.timeline.items[0]?.nombres).toBe('Sofia');
  });

  it('usa el rango semanal para la línea de tiempo', async () => {
    repositoryMock.listControlPanelLogs.mockImplementation(async (filters) => {
      const from = filters.dateFrom?.toISOString().slice(0, 10);
      const to = filters.dateTo?.toISOString().slice(0, 10);

      if (from === '2026-06-29' && to === '2026-07-05') {
        return [
          buildLog({
            id: 'log-week',
            employeeId: 'emp-2',
            timestamp: '2026-07-03T12:00:00.000Z',
            workDate: '2026-07-03',
            employee: {
              ...baseEmployee,
              id: 'emp-2',
              userId: 'user-2',
              name: 'Carlos Mendoza',
              position: 'Operario',
              area: 'Producción',
              contractType: EmployeeContractType.FIJO,
              user: { cedula: '11223344', documentType: DocumentType.CC },
              personalData: { nombres: 'Carlos', primerApellido: 'Mendoza', segundoApellido: null },
            },
          }),
        ];
      }

      return [];
    });

    const result = await service.getControlPanel('tenant-1', {
      anchorDate: '2026-07-01',
      period: 'week',
      page: 1,
      pageSize: 20,
    });

    expect(result.period).toBe('week');
    expect(result.dateFrom).toBe('2026-06-29');
    expect(result.dateTo).toBe('2026-07-05');
    expect(result.timeline.items).toHaveLength(1);
    expect(result.timeline.items[0]?.documentNumber).toBe('11223344');
    expect(repositoryMock.listMobileLogsForRange).toHaveBeenCalled();
  });

  it('pagina, filtra y ordena la línea de tiempo', async () => {
    repositoryMock.listControlPanelLogs.mockResolvedValue([
      buildLog({
        id: 'log-a',
        employeeId: 'emp-a',
        employee: {
          ...baseEmployee,
          id: 'emp-a',
          userId: 'user-a',
          name: 'Ana Perez',
          area: 'Cocina',
          contractType: EmployeeContractType.FIJO,
          user: { cedula: '55667788', documentType: DocumentType.CC },
          personalData: { nombres: 'Ana', primerApellido: 'Perez', segundoApellido: null },
        },
      }),
      buildLog({
        id: 'log-b',
        employeeId: 'emp-b',
        timestamp: '2026-07-01T18:00:00.000Z',
        employee: {
          ...baseEmployee,
          id: 'emp-b',
          userId: 'user-b',
          name: 'Bruno Diaz',
          area: 'Piso de venta',
          user: { cedula: '11223399', documentType: DocumentType.CC },
          personalData: { nombres: 'Bruno', primerApellido: 'Diaz', segundoApellido: null },
        },
      }),
    ]);

    const result = await service.getControlPanel('tenant-1', {
      anchorDate: '2026-07-01',
      area: 'Cocina',
      contractType: EmployeeContractType.FIJO,
      search: 'ana',
      page: 1,
      pageSize: 20,
      sortBy: 'documentNumber',
      sortDir: 'asc',
    });

    expect(result.timeline.total).toBe(1);
    expect(result.timeline.items[0]?.documentNumber).toBe('55667788');
    expect(result.filters.areas).toContain('Cocina');
    expect(result.filters.contractTypes).toContain(EmployeeContractType.FIJO);
  });

  it('genera alertas de geocerca y sin geolocalización', async () => {
    repositoryMock.listControlPanelLogs.mockResolvedValue([buildLog()]);
    repositoryMock.listMobileLogsForDay.mockResolvedValue([
      {
        id: 'mobile-geo',
        employeeId: 'emp-geo',
        timestamp: new Date('2026-07-01T16:00:00.000Z'),
        status: 'REJECTED',
        distanceMeters: 120,
        clientLatitude: 4.6,
        clientLongitude: -74.1,
        employee: { ...baseEmployee, id: 'emp-geo', name: 'Luis Rojas' },
        location: { id: 'loc-1', name: 'Gran Estación' },
      },
    ]);

    const result = await service.getControlPanel('tenant-1', {
      anchorDate: '2026-07-01',
      page: 1,
      pageSize: 20,
    });

    expect(result.alerts.some((alert) => alert.type === 'geofence')).toBe(true);
    expect(result.alerts.some((alert) => alert.type === 'no-geo')).toBe(true);
  });

  it('resuelve nombres y foto cuando no hay personalData', async () => {
    process.env.R2_PUBLIC_DOMAIN = 'cdn.example.com';
    repositoryMock.listControlPanelLogs.mockResolvedValue([
      buildLog({
        employee: {
          ...baseEmployee,
          name: 'Maria Elena Lopez Garcia',
          personalData: null,
          photoStorageObject: { key: 'photos/emp-1.jpg' },
        },
      }),
    ]);

    const result = await service.getControlPanel('tenant-1', {
      anchorDate: '2026-07-01',
      page: 1,
      pageSize: 20,
    });

    expect(result.timeline.items[0]?.nombres).toBe('Maria Elena');
    expect(result.timeline.items[0]?.primerApellido).toBe('Lopez');
    expect(result.timeline.items[0]?.photoUrl).toBe('https://cdn.example.com/photos/emp-1.jpg');
  });

  it('consolida periodo mensual y paginación', async () => {
    repositoryMock.listControlPanelLogs.mockImplementation(async (filters) => {
      const from = filters.dateFrom?.toISOString().slice(0, 10);
      const to = filters.dateTo?.toISOString().slice(0, 10);

      if (from === '2026-07-01' && to === '2026-07-31') {
        return Array.from({ length: 3 }, (_, index) =>
          buildLog({
            id: `log-${index}`,
            employeeId: `emp-${index}`,
            timestamp: `2026-07-0${index + 1}T12:00:00.000Z`,
            workDate: `2026-07-0${index + 1}`,
            employee: {
              ...baseEmployee,
              id: `emp-${index}`,
              userId: `user-${index}`,
              user: { cedula: `1000${index}`, documentType: DocumentType.CC },
              personalData: {
                nombres: `Emp${index}`,
                primerApellido: 'Test',
                segundoApellido: null,
              },
            },
          }),
        );
      }

      return [];
    });

    const result = await service.getControlPanel('tenant-1', {
      anchorDate: '2026-07-01',
      period: 'month',
      page: 2,
      pageSize: 1,
      sortBy: 'hasGeo',
      sortDir: 'desc',
    });

    expect(result.period).toBe('month');
    expect(result.timeline.total).toBe(3);
    expect(result.timeline.page).toBe(2);
    expect(result.timeline.items).toHaveLength(1);
    expect(repositoryMock.listMobileLogsForRange).toHaveBeenCalled();
  });
});
