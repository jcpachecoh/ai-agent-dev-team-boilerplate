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
  listDismissedAlertKeys: jest.fn(),
  dismissAlert: jest.fn(),
};

const USER_ID = 'user-current';

const userLocationsServiceMock = {
  resolveAllowedLocationIds: jest.fn().mockResolvedValue(null),
  assertLocationAllowed: jest.fn(),
  getActiveUserLocations: jest.fn().mockResolvedValue([]),
};

const actor = { sub: USER_ID, roleCode: 'OWNER' };

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
    source: string;
    validationStatus: string;
    distanceMeters: number;
    clientLatitude: number | null;
    clientLongitude: number | null;
  }> = {},
) {
  return {
    id: overrides.id ?? 'log-1',
    employeeId: overrides.employeeId ?? 'emp-1',
    locationId: 'loc-1',
    eventType: overrides.eventType ?? AttendanceEventType.ENTRY,
    source: overrides.source ?? 'APP_MOVIL',
    validationStatus: overrides.validationStatus ?? null,
    distanceMeters: overrides.distanceMeters ?? null,
    clientLatitude: overrides.clientLatitude === undefined ? 4.6 : overrides.clientLatitude,
    clientLongitude: overrides.clientLongitude === undefined ? -74.1 : overrides.clientLongitude,
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
    service = new AttendanceControlPanelService(
      repositoryMock as never,
      userLocationsServiceMock as never,
    );
    jest.clearAllMocks();
    userLocationsServiceMock.resolveAllowedLocationIds.mockResolvedValue(null);
    delete process.env.R2_PUBLIC_DOMAIN;
    repositoryMock.findTenantLabel.mockResolvedValue('INVERSIONES LLANES S.A.S');
    repositoryMock.listActiveLocations.mockResolvedValue([
      { id: 'loc-1', name: 'Gran Estación', tenantId: 'tenant-1' },
    ]);
    repositoryMock.listDismissedAlertKeys.mockResolvedValue(new Set());
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

    const result = await service.getControlPanel(
      'tenant-1',
      USER_ID,
      {
        anchorDate: '2026-07-01',
        page: 1,
        pageSize: 20,
      },
      actor,
    );

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

    const result = await service.getControlPanel(
      'tenant-1',
      USER_ID,
      {
        anchorDate: '2026-07-01',
        period: 'week',
        page: 1,
        pageSize: 20,
      },
      actor,
    );

    expect(result.period).toBe('week');
    expect(result.dateFrom).toBe('2026-06-29');
    expect(result.dateTo).toBe('2026-07-05');
    expect(result.timeline.items).toHaveLength(1);
    expect(result.timeline.items[0]?.documentNumber).toBe('11223344');
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

    const result = await service.getControlPanel(
      'tenant-1',
      USER_ID,
      {
        anchorDate: '2026-07-01',
        area: 'Cocina',
        contractType: EmployeeContractType.FIJO,
        search: 'ana',
        page: 1,
        pageSize: 20,
        sortBy: 'documentNumber',
        sortDir: 'asc',
      },
      actor,
    );

    expect(result.timeline.total).toBe(1);
    expect(result.timeline.items[0]?.documentNumber).toBe('55667788');
    expect(result.filters.areas).toContain('Cocina');
    expect(result.filters.contractTypes).toContain(EmployeeContractType.FIJO);
  });

  it('genera alertas de geocerca y sin geolocalización', async () => {
    repositoryMock.listControlPanelLogs.mockResolvedValue([
      buildLog({
        id: 'log-no-geo',
        employeeId: 'emp-1',
        source: 'DEVICE',
        clientLatitude: null,
        clientLongitude: null,
      }),
      buildLog({
        id: 'log-geo',
        employeeId: 'emp-geo',
        source: 'APP_MOVIL',
        validationStatus: 'REJECTED',
        distanceMeters: 120,
        clientLatitude: 4.6,
        clientLongitude: -74.1,
        employee: { ...baseEmployee, id: 'emp-geo', name: 'Luis Rojas' },
      }),
    ]);

    const result = await service.getControlPanel(
      'tenant-1',
      USER_ID,
      {
        anchorDate: '2026-07-01',
        page: 1,
        pageSize: 20,
      },
      actor,
    );

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

    const result = await service.getControlPanel(
      'tenant-1',
      USER_ID,
      {
        anchorDate: '2026-07-01',
        page: 1,
        pageSize: 20,
      },
      actor,
    );

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

    const result = await service.getControlPanel(
      'tenant-1',
      USER_ID,
      {
        anchorDate: '2026-07-01',
        period: 'month',
        page: 2,
        pageSize: 1,
        sortBy: 'hasGeo',
        sortDir: 'desc',
      },
      actor,
    );

    expect(result.period).toBe('month');
    expect(result.timeline.total).toBe(3);
    expect(result.timeline.page).toBe(2);
    expect(result.timeline.items).toHaveLength(1);
  });

  // ── OS-548: pageSize 20/50/100 ───────────────────────────────────────────────

  describe('pageSize', () => {
    beforeEach(() => {
      repositoryMock.listControlPanelLogs.mockResolvedValue(
        Array.from({ length: 120 }, (_, index) =>
          buildLog({
            id: `log-${index}`,
            employeeId: `emp-${index}`,
            timestamp: `2026-07-01T${String(8 + (index % 10)).padStart(2, '0')}:00:00.000Z`,
            employee: {
              ...baseEmployee,
              id: `emp-${index}`,
              userId: `user-${index}`,
              user: { cedula: `9000${index}`, documentType: DocumentType.CC },
              personalData: {
                nombres: `Emp${index}`,
                primerApellido: 'Test',
                segundoApellido: null,
              },
            },
          }),
        ),
      );
    });

    it.each([20, 50, 100])(
      'respeta pageSize=%i en la paginación de la línea de tiempo',
      async (pageSize) => {
        const result = await service.getControlPanel(
          'tenant-1',
          USER_ID,
          {
            anchorDate: '2026-07-01',
            page: 1,
            pageSize,
          },
          actor,
        );

        expect(result.timeline.pageSize).toBe(pageSize);
        expect(result.timeline.items).toHaveLength(pageSize);
        expect(result.timeline.total).toBe(120);
      },
    );
  });

  // ── OS-548: filtro clasificacion (reutiliza mapeo OS-578) ───────────────────

  describe('filtro clasificacion', () => {
    beforeEach(() => {
      repositoryMock.listControlPanelLogs.mockResolvedValue([buildLog()]);
    });

    it('clasificacion=todos: no forwarding de laborClassifications', async () => {
      await service.getControlPanel(
        'tenant-1',
        USER_ID,
        {
          anchorDate: '2026-07-01',
          clasificacion: 'todos',
          page: 1,
          pageSize: 20,
        },
        actor,
      );

      const call = repositoryMock.listControlPanelLogs.mock.calls[0][0];
      expect(call.laborClassifications).toBeUndefined();
    });

    it('clasificacion=administrativo: forwarding [ADMINISTRATIVO] a logs', async () => {
      const result = await service.getControlPanel(
        'tenant-1',
        USER_ID,
        {
          anchorDate: '2026-07-01',
          clasificacion: 'administrativo',
          page: 1,
          pageSize: 20,
        },
        actor,
      );

      const call = repositoryMock.listControlPanelLogs.mock.calls[0][0];
      expect(call.laborClassifications).toEqual(['ADMINISTRATIVO']);
      expect(result.clasificacion).toBe('administrativo');
    });

    it('clasificacion=operaciones: forwarding [COCINA, SERVICIO] a logs', async () => {
      const result = await service.getControlPanel(
        'tenant-1',
        USER_ID,
        {
          anchorDate: '2026-07-01',
          clasificacion: 'operaciones',
          page: 1,
          pageSize: 20,
        },
        actor,
      );

      const call = repositoryMock.listControlPanelLogs.mock.calls[0][0];
      expect(call.laborClassifications).toEqual(['COCINA', 'SERVICIO']);
      expect(result.clasificacion).toBe('operaciones');
    });
  });

  // ── OS-548: descarte de alertas persistido ──────────────────────────────────

  describe('dismissAlert', () => {
    it('delega en el repositorio y retorna alertKey + dismissedAt', async () => {
      repositoryMock.dismissAlert.mockResolvedValue({
        id: 'dismiss-1',
        tenantId: 'tenant-1',
        userId: USER_ID,
        alertKey: 'geo-mobile-geo',
        dismissedAt: new Date('2026-07-01T18:00:00.000Z'),
        createdAt: new Date('2026-07-01T18:00:00.000Z'),
      });

      const result = await service.dismissAlert('tenant-1', USER_ID, 'geo-mobile-geo');

      expect(repositoryMock.dismissAlert).toHaveBeenCalledWith(
        'tenant-1',
        USER_ID,
        'geo-mobile-geo',
      );
      expect(result).toEqual({
        alertKey: 'geo-mobile-geo',
        dismissedAt: '2026-07-01T18:00:00.000Z',
      });
    });
  });

  describe('alertas descartadas', () => {
    beforeEach(() => {
      repositoryMock.listControlPanelLogs.mockResolvedValue([
        buildLog(),
        buildLog({
          id: 'log-geo',
          employeeId: 'emp-geo',
          source: 'APP_MOVIL',
          validationStatus: 'REJECTED',
          distanceMeters: 120,
          employee: { ...baseEmployee, id: 'emp-geo', name: 'Luis Rojas' },
        }),
      ]);
    });

    it('una alerta descartada por el usuario actual no reaparece para ese mismo usuario', async () => {
      repositoryMock.listDismissedAlertKeys.mockImplementation(async (_tenantId, userId) =>
        userId === USER_ID ? new Set(['geo-log-geo']) : new Set(),
      );

      const result = await service.getControlPanel(
        'tenant-1',
        USER_ID,
        {
          anchorDate: '2026-07-01',
          page: 1,
          pageSize: 20,
        },
        actor,
      );

      expect(result.alerts.some((alert) => alert.id === 'geo-log-geo')).toBe(false);
    });

    it('una alerta descartada por un usuario sí aparece para otro usuario', async () => {
      repositoryMock.listDismissedAlertKeys.mockImplementation(async (_tenantId, userId) =>
        userId === USER_ID ? new Set(['geo-log-geo']) : new Set(),
      );

      const result = await service.getControlPanel(
        'tenant-1',
        'other-user',
        {
          anchorDate: '2026-07-01',
          page: 1,
          pageSize: 20,
        },
        actor,
      );

      expect(result.alerts.some((alert) => alert.id === 'geo-log-geo')).toBe(true);
    });
  });
});
