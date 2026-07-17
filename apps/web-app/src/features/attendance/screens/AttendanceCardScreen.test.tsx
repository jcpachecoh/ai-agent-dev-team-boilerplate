import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { formatDisplayDate, getCurrentMonthRange, toIsoDate } from '../utils/attendance-card-dates';
import { AttendanceCardScreen } from './AttendanceCardScreen';

const getAttendanceCardMock = vi.fn();
const upsertAttendanceObservationMock = vi.fn();
const createManualMarkingMock = vi.fn();
const deleteManualMarkingMock = vi.fn();

const MOCK_MANUAL_MARKING_REASONS = [
  {
    code: 'CORRECCION_MARCACION',
    label: 'Corrección de marcación',
    target: 'ATTENDANCE_ONLY' as const,
  },
  {
    code: 'PERMISO_REMUNERADO',
    label: 'Permiso remunerado',
    target: 'PAYROLL_NOVEDAD' as const,
    novedadType: 'PERMISO_REMUNERADO',
  },
  {
    code: 'LICENCIA_LUTO',
    label: 'Licencia de luto',
    target: 'PAYROLL_NOVEDAD' as const,
    novedadType: 'LICENCIA_LUTO',
  },
  {
    code: 'INCAPACIDAD_COMUN',
    label: 'Incapacidad médica (común)',
    target: 'MEDICAL_LEAVE' as const,
    leaveOrigin: 'COMUN' as const,
  },
];

vi.mock('../hooks/useManualMarkingReasonsQuery', () => ({
  useManualMarkingReasonsQuery: () => ({
    data: MOCK_MANUAL_MARKING_REASONS,
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('@/features/payroll/hooks/useNovedadTypeConfigQuery', () => ({
  useNovedadTypeConfigQuery: () => ({
    data: [
      { type: 'PERMISO_REMUNERADO', requiresSupportDocument: false },
      { type: 'LICENCIA_LUTO', requiresSupportDocument: true },
    ],
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('../api/attendance.client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/attendance.client')>();
  return {
    ...actual,
    getAttendanceCard: (...args: unknown[]) => getAttendanceCardMock(...args),
    upsertAttendanceObservation: (...args: unknown[]) => upsertAttendanceObservationMock(...args),
    createManualMarking: (...args: unknown[]) => createManualMarkingMock(...args),
    deleteManualMarking: (...args: unknown[]) => deleteManualMarkingMock(...args),
  };
});

const useMeMock = vi.fn();

vi.mock('@/features/auth/hooks/useMe', () => ({
  useMe: () => useMeMock(),
}));

const useAttendanceCardOvertimeQueryMock = vi.fn();
const useAttendanceCardOvertimeReasonsMock = vi.fn();

vi.mock('../hooks/useAttendanceCardOvertimeQuery', () => ({
  useAttendanceCardOvertimeQuery: (...args: unknown[]) =>
    useAttendanceCardOvertimeQueryMock(...args),
}));

vi.mock('../hooks/useAttendanceCardOvertimeReasons', () => ({
  useAttendanceCardOvertimeReasons: (...args: unknown[]) =>
    useAttendanceCardOvertimeReasonsMock(...args),
}));

const getPayrollEmployeeByUserIdMock = vi.fn();

vi.mock('@/features/payroll/api/payroll.client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/payroll/api/payroll.client')>();
  return {
    ...actual,
    getPayrollEmployeeByUserId: (...args: unknown[]) => getPayrollEmployeeByUserIdMock(...args),
  };
});

async function findFirstObservationButton() {
  const buttons = await screen.findAllByLabelText(/Ver observación de/);
  return buttons[0]!;
}

async function findFirstManualMarkIndicator() {
  const elements = await screen.findAllByTitle('Marcación manual');
  return elements[0]!;
}

async function selectChangeReason(label: string) {
  fireEvent.click(screen.getByLabelText('Motivo de cambio'));
  fireEvent.click(await screen.findByRole('option', { name: label }));
}

const monthRange = getCurrentMonthRange();
const WORK_DATE = toIsoDate(monthRange.from);
const ROW_ACTIONS_NAME = `Acciones para ${formatDisplayDate(WORK_DATE)}`;

function clickRowActionsMenu() {
  const buttons = screen.getAllByRole('button', { name: ROW_ACTIONS_NAME });
  fireEvent.click(buttons[0]!);
}

function clickMarkingMenuItem() {
  const items = screen.getAllByRole('menuitem', { name: 'Crear/Editar Marcación' });
  fireEvent.click(items[0]!);
}

const employee = {
  id: 'emp-1',
  name: 'Ana Pérez',
  position: 'Mesera',
  contractType: 'INDEFINIDO',
  hireDate: '2024-01-01',
  locationId: 'loc-1',
  user: { cedula: '123456' },
};

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/asistencia/asistencias/loc-1/employees/user-1/card']}>
      <Routes>
        <Route
          path="/asistencia/asistencias/:locationId/employees/:userId/card"
          element={<AttendanceCardScreen />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AttendanceCardScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMeMock.mockReturnValue({ data: { roleCode: 'OWNER', email: 'owner@restopsiq.dev' } });
    getPayrollEmployeeByUserIdMock.mockResolvedValue(employee);
    useAttendanceCardOvertimeQueryMock.mockReturnValue({
      data: { items: [], pageInfo: { hasNextPage: false, endCursor: null } },
      isLoading: false,
      isError: false,
    });
    useAttendanceCardOvertimeReasonsMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    getAttendanceCardMock.mockResolvedValue({
      logs: [
        {
          id: 'log-1',
          employeeId: 'emp-1',
          locationId: 'loc-1',
          eventType: 'ENTRY',
          timestamp: `${WORK_DATE}T13:00:00.000Z`,
          workDate: WORK_DATE,
          source: 'DEVICE',
        },
      ],
      observations: [
        {
          id: 'obs-1',
          employeeId: 'emp-1',
          workDate: WORK_DATE,
          note: 'Llegó tarde por transporte público',
          createdAt: WORK_DATE,
          updatedAt: `${WORK_DATE}T15:00:00.000Z`,
          createdBy: { email: 'ana@restopsiq.dev' },
          updatedBy: { email: 'ana@restopsiq.dev' },
        },
      ],
      daySummaries: [],
    });
  });

  it('muestra el indicador de observación para el día con nota guardada en backend', async () => {
    renderScreen();

    expect(await findFirstObservationButton()).toBeInTheDocument();
  });

  it('clic directo en el ícono de observación abre el modal con la nota y el editor', async () => {
    renderScreen();

    fireEvent.click(await findFirstObservationButton());

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nota/)).toHaveValue('Llegó tarde por transporte público');
    expect(screen.getByText(/Última edición por ana@restopsiq\.dev/)).toBeInTheDocument();
  });

  it('guarda una observación llamando a la API real (no localStorage)', async () => {
    upsertAttendanceObservationMock.mockResolvedValue({ id: 'obs-1', note: 'Nueva nota' });
    renderScreen();

    await findFirstObservationButton();
    clickRowActionsMenu();
    const observationItems = screen.getAllByRole('menuitem', { name: 'Observación' });
    fireEvent.click(observationItems[0]!);

    const textarea = screen.getByLabelText(/Nota/);
    fireEvent.change(textarea, { target: { value: 'Nueva nota' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(upsertAttendanceObservationMock).toHaveBeenCalledWith('user-1', {
        workDate: WORK_DATE,
        note: 'Nueva nota',
        locationId: 'loc-1',
      });
    });
  });

  it('marca manual (source=MANUAL) se distingue visualmente de la automática', async () => {
    getAttendanceCardMock.mockResolvedValue({
      logs: [
        {
          id: 'log-manual',
          employeeId: 'emp-1',
          locationId: 'loc-1',
          eventType: 'ENTRY',
          timestamp: `${WORK_DATE}T08:00:00.000Z`,
          workDate: WORK_DATE,
          source: 'MANUAL',
        },
      ],
      observations: [],
    });

    renderScreen();

    expect(await findFirstManualMarkIndicator()).toBeInTheDocument();
  });

  it('muestra motivo y autor de una marcación manual existente al abrir el modal de edición', async () => {
    getAttendanceCardMock.mockResolvedValue({
      logs: [
        {
          id: 'log-manual',
          employeeId: 'emp-1',
          locationId: 'loc-1',
          eventType: 'ENTRY',
          timestamp: `${WORK_DATE}T08:00:00.000Z`,
          workDate: WORK_DATE,
          source: 'MANUAL',
          manualReason: 'Olvidó marcar entrada',
          createdBy: { email: 'supervisor@restopsiq.dev' },
          createdAt: `${WORK_DATE}T09:00:00.000Z`,
        },
      ],
      observations: [],
    });

    renderScreen();

    await findFirstManualMarkIndicator();
    clickRowActionsMenu();
    clickMarkingMenuItem();

    expect(screen.getByText(/Marcaciones registradas este día/)).toBeInTheDocument();
    expect(screen.getByText(/Motivo: Olvidó marcar entrada/)).toBeInTheDocument();
    expect(screen.getByText(/supervisor@restopsiq\.dev/)).toBeInTheDocument();
  });

  it('crear marcación manual llama a la API con los datos del formulario', async () => {
    createManualMarkingMock.mockResolvedValue({ id: 'log-manual-1', source: 'MANUAL' });
    renderScreen();

    await findFirstObservationButton();
    clickRowActionsMenu();
    clickMarkingMenuItem();

    await selectChangeReason('Corrección de marcación');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(createManualMarkingMock).toHaveBeenCalledWith('user-1', {
        workDate: WORK_DATE,
        eventType: 'ENTRY',
        timestamp: expect.any(String),
        reason: 'CORRECCION_MARCACION',
        locationId: 'loc-1',
        supportStorageObjectId: undefined,
      });
    });
  });

  it('no permite editar marcaciones sin rol autorizado (gate client-side)', async () => {
    useMeMock.mockReturnValue({ data: { roleCode: 'NOMINA', email: 'nomina@restopsiq.dev' } });

    renderScreen();

    await findFirstObservationButton();
    clickRowActionsMenu();
    clickMarkingMenuItem();

    expect(createManualMarkingMock).not.toHaveBeenCalled();
  });

  describe('OS-553: kebab menu / modal crear-editar marcación', () => {
    function mockDayWithMarks() {
      getAttendanceCardMock.mockResolvedValue({
        logs: [
          {
            id: 'log-device',
            employeeId: 'emp-1',
            locationId: 'loc-1',
            eventType: 'ENTRY',
            timestamp: `${WORK_DATE}T08:00:00.000Z`,
            workDate: WORK_DATE,
            source: 'DEVICE',
          },
          {
            id: 'log-manual',
            employeeId: 'emp-1',
            locationId: 'loc-1',
            eventType: 'EXIT',
            timestamp: `${WORK_DATE}T17:00:00.000Z`,
            workDate: WORK_DATE,
            source: 'MANUAL',
            manualReason: 'Olvidó marcar salida',
            createdBy: { email: 'supervisor@restopsiq.dev' },
          },
        ],
        observations: [],
      });
    }

    async function openMarkingModal() {
      renderScreen();
      await findFirstManualMarkIndicator();
      clickRowActionsMenu();
      clickMarkingMenuItem();
    }

    it('muestra el texto principal del alert tal como pide la referencia', async () => {
      mockDayWithMarks();
      await openMarkingModal();

      expect(
        screen.getByText('¡Solo se pueden modificar o eliminar marcas manuales.'),
      ).toBeInTheDocument();
    });

    it('marca manual existente muestra botón eliminar; marca DEVICE muestra candado (no eliminable)', async () => {
      mockDayWithMarks();
      await openMarkingModal();

      expect(
        screen.getByRole('button', { name: /Eliminar marcación manual de salida/ }),
      ).toBeInTheDocument();
      // El log DEVICE no debe tener ningún botón de eliminar asociado.
      expect(
        screen.queryByRole('button', { name: /Eliminar marcación manual de entrada/ }),
      ).not.toBeInTheDocument();
    });

    it('eliminar marca manual pide confirmación y llama a la API', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      deleteManualMarkingMock.mockResolvedValue(undefined);
      mockDayWithMarks();
      await openMarkingModal();

      fireEvent.click(screen.getByRole('button', { name: /Eliminar marcación manual de salida/ }));

      expect(confirmSpy).toHaveBeenCalled();
      await waitFor(() => {
        expect(deleteManualMarkingMock).toHaveBeenCalledWith('log-manual');
      });

      confirmSpy.mockRestore();
    });

    it('cancelar la confirmación no elimina la marca', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      mockDayWithMarks();
      await openMarkingModal();

      fireEvent.click(screen.getByRole('button', { name: /Eliminar marcación manual de salida/ }));

      expect(deleteManualMarkingMock).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('el selector de motivo ofrece el catálogo unificado CONN-05', async () => {
      mockDayWithMarks();
      await openMarkingModal();

      fireEvent.click(screen.getByLabelText('Motivo de cambio'));

      expect(screen.getByRole('option', { name: 'Corrección de marcación' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Permiso remunerado' })).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Incapacidad médica (común)' }),
      ).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'Olvido de marcación' })).not.toBeInTheDocument();
    });
  });

  describe('OS-606 Task-07 — origen overtime en HEAprob', () => {
    it('conserva presentación de detección automática con origen', async () => {
      getAttendanceCardMock.mockResolvedValue({
        logs: [
          {
            id: 'log-1',
            employeeId: 'emp-1',
            locationId: 'loc-1',
            eventType: 'ENTRY',
            timestamp: `${WORK_DATE}T13:00:00.000Z`,
            workDate: WORK_DATE,
            source: 'DEVICE',
          },
          {
            id: 'log-2',
            employeeId: 'emp-1',
            locationId: 'loc-1',
            eventType: 'EXIT',
            timestamp: `${WORK_DATE}T23:00:00.000Z`,
            workDate: WORK_DATE,
            source: 'DEVICE',
          },
        ],
        observations: [],
        daySummaries: [
          {
            workDate: WORK_DATE,
            targetMinutes: 480,
            targetHours: '08:00:00',
            ordinaryMinutes: 480,
            unworkedMinutes: 0,
            overtimeMinutes: 45,
            resolvedKind: 'ASSIGNED',
            shiftName: 'Tarde',
            shiftRange: '14:00-22:00',
          },
        ],
      });
      useAttendanceCardOvertimeQueryMock.mockReturnValue({
        data: {
          items: [
            {
              id: 'req-auto',
              employeeId: 'emp-1',
              employeeName: 'Ana',
              locationId: 'loc-1',
              locationName: 'PL-01',
              type: 'DETECCION_AUTOMATICA',
              accumulatedMinutes: 45,
              shiftEndTime: `${WORK_DATE}T22:00:00.000Z`,
              actualEndTime: `${WORK_DATE}T22:45:00.000Z`,
              status: 'PENDIENTE_ADMIN',
              payrollPeriod: WORK_DATE.slice(0, 7),
              createdAt: `${WORK_DATE}T22:45:00.000Z`,
              updatedAt: `${WORK_DATE}T22:45:00.000Z`,
            },
          ],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
        isLoading: false,
        isError: false,
      });

      renderScreen();

      expect(
        await screen.findAllByText(/Detección automática · Pendiente \(45 min\)/),
      ).not.toHaveLength(0);
    });

    it('muestra solicitud administrativa con estado, ventana y motivo', async () => {
      getAttendanceCardMock.mockResolvedValue({
        logs: [],
        observations: [],
        daySummaries: [
          {
            workDate: WORK_DATE,
            targetMinutes: 480,
            targetHours: '08:00:00',
            ordinaryMinutes: 0,
            unworkedMinutes: 480,
            overtimeMinutes: 0,
            resolvedKind: 'ASSIGNED',
            shiftName: 'Tarde',
            shiftRange: '14:00-22:00',
          },
        ],
      });
      useAttendanceCardOvertimeQueryMock.mockReturnValue({
        data: {
          items: [
            {
              id: 'req-admin',
              employeeId: 'emp-1',
              employeeName: 'Ana',
              locationId: 'loc-1',
              locationName: 'PL-01',
              type: 'SOLICITUD_ADMINISTRATIVA',
              accumulatedMinutes: null,
              shiftEndTime: null,
              actualEndTime: null,
              status: 'PENDIENTE_GERENCIA_OPERACIONES',
              payrollPeriod: WORK_DATE.slice(0, 7),
              workDate: WORK_DATE,
              proposedStartTime: `${WORK_DATE}T22:00:00.000-05:00`,
              proposedEndTime: `${WORK_DATE}T23:30:00.000-05:00`,
              proposedMinutes: 90,
              reasonOptionId: 'reason-1',
              createdAt: `${WORK_DATE}T10:00:00.000Z`,
              updatedAt: `${WORK_DATE}T10:00:00.000Z`,
            },
          ],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
        isLoading: false,
        isError: false,
      });
      useAttendanceCardOvertimeReasonsMock.mockReturnValue({
        data: [
          {
            id: 'reason-1',
            name: 'Inventario físico semana',
            type: 'OVERTIME_REASON',
            isActive: false,
          },
        ],
        isLoading: false,
        isError: false,
      });

      renderScreen();

      const cells = await screen.findAllByText(
        /Solicitud administrativa · Pendiente gerencia operaciones/,
      );
      expect(cells.length).toBeGreaterThan(0);
      expect(cells[0]!.textContent).toContain('Inventario físico semana');
      expect(cells[0]!.textContent).toContain('90 min');
    });
  });
});
