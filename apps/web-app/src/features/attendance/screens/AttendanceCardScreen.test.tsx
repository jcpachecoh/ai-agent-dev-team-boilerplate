import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { formatDisplayDate, getCurrentMonthRange, toIsoDate } from '../utils/attendance-card-dates';
import { AttendanceCardScreen } from './AttendanceCardScreen';

const getAttendanceCardMock = vi.fn();
const upsertAttendanceObservationMock = vi.fn();
const createManualMarkingMock = vi.fn();
const deleteManualMarkingMock = vi.fn();

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

const getPayrollEmployeeByUserIdMock = vi.fn();

vi.mock('@/features/payroll/api/payroll.client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/payroll/api/payroll.client')>();
  return {
    ...actual,
    getPayrollEmployeeByUserId: (...args: unknown[]) => getPayrollEmployeeByUserIdMock(...args),
  };
});

const monthRange = getCurrentMonthRange();
const WORK_DATE = toIsoDate(monthRange.from);
const ROW_ACTIONS_NAME = `Acciones para ${formatDisplayDate(WORK_DATE)}`;

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
    });
  });

  it('muestra el indicador de observación para el día con nota guardada en backend', async () => {
    renderScreen();

    expect(await screen.findByLabelText(/Ver observación de/)).toBeInTheDocument();
  });

  it('clic directo en el ícono de observación abre el modal con la nota y el editor', async () => {
    renderScreen();

    fireEvent.click(await screen.findByLabelText(/Ver observación de/));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nota/)).toHaveValue('Llegó tarde por transporte público');
    expect(screen.getByText(/Última edición por ana@restopsiq\.dev/)).toBeInTheDocument();
  });

  it('guarda una observación llamando a la API real (no localStorage)', async () => {
    upsertAttendanceObservationMock.mockResolvedValue({ id: 'obs-1', note: 'Nueva nota' });
    renderScreen();

    await screen.findByLabelText(/Ver observación de/);
    fireEvent.click(screen.getByRole('button', { name: ROW_ACTIONS_NAME }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Observación' }));

    const textarea = screen.getByLabelText(/Nota/);
    fireEvent.change(textarea, { target: { value: 'Nueva nota' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(upsertAttendanceObservationMock).toHaveBeenCalledWith('user-1', {
        workDate: WORK_DATE,
        note: 'Nueva nota',
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

    expect(await screen.findByTitle('Marcación manual')).toBeInTheDocument();
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

    await screen.findByTitle('Marcación manual');
    fireEvent.click(screen.getByRole('button', { name: ROW_ACTIONS_NAME }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Crear/Editar Marcación' }));

    expect(screen.getByText(/Marcaciones registradas este día/)).toBeInTheDocument();
    expect(screen.getByText(/Motivo: Olvidó marcar entrada/)).toBeInTheDocument();
    expect(screen.getByText(/supervisor@restopsiq\.dev/)).toBeInTheDocument();
  });

  it('crear marcación manual llama a la API con los datos del formulario', async () => {
    createManualMarkingMock.mockResolvedValue({ id: 'log-manual-1', source: 'MANUAL' });
    renderScreen();

    await screen.findByLabelText(/Ver observación de/);
    fireEvent.click(screen.getByRole('button', { name: ROW_ACTIONS_NAME }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Crear/Editar Marcación' }));

    fireEvent.change(screen.getByLabelText('Motivo de cambio:'), {
      target: { value: 'FORGOT' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(createManualMarkingMock).toHaveBeenCalledWith('user-1', {
        workDate: WORK_DATE,
        eventType: 'ENTRY',
        timestamp: expect.any(String),
        reason: 'FORGOT',
      });
    });
  });

  it('no permite editar marcaciones sin rol autorizado (gate client-side)', async () => {
    useMeMock.mockReturnValue({ data: { roleCode: 'NOMINA', email: 'nomina@restopsiq.dev' } });

    renderScreen();

    await screen.findByLabelText(/Ver observación de/);
    fireEvent.click(screen.getByRole('button', { name: ROW_ACTIONS_NAME }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Crear/Editar Marcación' }));

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
      await screen.findByTitle('Marcación manual');
      fireEvent.click(screen.getByRole('button', { name: ROW_ACTIONS_NAME }));
      fireEvent.click(screen.getByRole('menuitem', { name: 'Crear/Editar Marcación' }));
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

    it('el select de motivo de cambio solo ofrece los códigos aceptados por el backend', async () => {
      mockDayWithMarks();
      await openMarkingModal();

      const select = screen.getByLabelText('Motivo de cambio:') as HTMLSelectElement;
      const values = Array.from(select.options).map((option) => option.value);

      expect(values).toEqual(
        expect.arrayContaining([
          'FORGOT',
          'DEVICE_FAILURE',
          'SUPERVISOR_CORRECTION',
          'SYSTEM_ERROR',
          'OTHER',
        ]),
      );
      // Ningún valor fuera de este catálogo (más la opción vacía inicial).
      values.forEach((value) => {
        expect([
          '',
          'FORGOT',
          'DEVICE_FAILURE',
          'SUPERVISOR_CORRECTION',
          'SYSTEM_ERROR',
          'OTHER',
        ]).toContain(value);
      });
    });
  });
});
