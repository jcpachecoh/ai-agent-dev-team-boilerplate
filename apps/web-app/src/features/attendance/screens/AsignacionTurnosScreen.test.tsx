import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { addWeeks, formatDateOnly, getMondayOfWeek } from '../utils/week.utils';
import { AsignacionTurnosScreen } from './AsignacionTurnosScreen';

const currentWeekStart = getMondayOfWeek(new Date());
const nextWeekStart = formatDateOnly(addWeeks(currentWeekStart, 1));
// tras "Siguiente" (+1) y dos veces "Anterior" (-2) el neto es -1 semana desde la actual
const oneWeekBeforeCurrent = formatDateOnly(addWeeks(currentWeekStart, -1));

const getWeeklyAssignmentsMock = vi.fn();
const assignTurnoMock = vi.fn();
const deleteAssignmentMock = vi.fn();
const listTurnosMock = vi.fn();

vi.mock('@/features/auth/hooks/useMe', () => ({
  useMe: () => ({ data: { roleCode: 'OWNER' } }),
}));

vi.mock('@/lib/auth-token', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth-token')>();
  return { ...actual, getRoleCodeFromToken: () => 'OWNER' };
});

vi.mock('../api/turno-assignments.api', () => ({
  getWeeklyAssignments: (...args: unknown[]) => getWeeklyAssignmentsMock(...args),
  assignTurno: (...args: unknown[]) => assignTurnoMock(...args),
  deleteAssignment: (...args: unknown[]) => deleteAssignmentMock(...args),
}));

vi.mock('../api/turnos.api', () => ({
  listTurnos: (...args: unknown[]) => listTurnosMock(...args),
}));

const baseWeekly = {
  weekStart: '2026-07-06',
  dates: [
    '2026-07-06',
    '2026-07-07',
    '2026-07-08',
    '2026-07-09',
    '2026-07-10',
    '2026-07-11',
    '2026-07-12',
  ],
  colaboradores: [
    {
      id: 'emp-1',
      userId: 'user-1',
      nombre: 'ana perez',
      documento: '123456',
      locationId: 'loc-1',
      turnos: [
        { fecha: '2026-07-06', type: 'BASE', turno: null, esDescanso: false, turnoBase: true },
        {
          fecha: '2026-07-07',
          assignmentId: 'assignment-1',
          type: 'ASSIGNED',
          turno: {
            id: 'turno-1',
            nombre: 'Turno mañana',
            sigla: 'TM',
            horaInicio: '06:00',
            horaFin: '14:00',
            jornada: 'DIURNO',
          },
          esDescanso: false,
          turnoBase: false,
        },
        {
          fecha: '2026-07-08',
          assignmentId: 'assignment-2',
          type: 'REST',
          turno: null,
          esDescanso: true,
          turnoBase: false,
        },
        { fecha: '2026-07-09', type: 'BASE', turno: null, esDescanso: false, turnoBase: true },
        { fecha: '2026-07-10', type: 'BASE', turno: null, esDescanso: false, turnoBase: true },
        { fecha: '2026-07-11', type: 'BASE', turno: null, esDescanso: false, turnoBase: true },
        { fecha: '2026-07-12', type: 'BASE', turno: null, esDescanso: false, turnoBase: true },
      ],
    },
  ],
  pagination: { total: 1, page: 1, limit: 50 },
};

const activeTurnos = {
  data: [
    {
      id: 'turno-1',
      nombre: 'Turno mañana',
      sigla: 'TM',
      tipo: 'PERMANENTE',
      jornada: 'DIURNO',
      horaInicio: '06:00',
      horaFin: '14:00',
      estado: true,
      createdAt: '',
      updatedAt: '',
    },
  ],
  pagination: { total: 1, page: 1, limit: 200, totalPages: 1 },
};

function renderScreen(): void {
  render(
    <MemoryRouter>
      <AsignacionTurnosScreen />
    </MemoryRouter>,
  );
}

describe('AsignacionTurnosScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getWeeklyAssignmentsMock.mockResolvedValue(baseWeekly);
    listTurnosMock.mockResolvedValue(activeTurnos);
  });

  it('renderiza la grilla semanal con colaboradores y días', async () => {
    renderScreen();

    expect(await screen.findByText('ANA PEREZ')).toBeInTheDocument();
    expect(screen.getByText('123456')).toBeInTheDocument();
    expect(screen.getAllByText('Lun')).toHaveLength(1);
    expect(screen.getAllByText('Dom')).toHaveLength(1);
  });

  it('el descanso explícito se ve distinto del turno base', async () => {
    renderScreen();

    expect(await screen.findByText('Descanso explícito')).toBeInTheDocument();
    expect(screen.getAllByText('Descanso + Turno Base')).toHaveLength(5);
  });

  it('navega a la semana siguiente y anterior', async () => {
    renderScreen();
    await screen.findByText('ANA PEREZ');
    getWeeklyAssignmentsMock.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() => {
      expect(getWeeklyAssignmentsMock).toHaveBeenCalledWith(
        expect.objectContaining({ weekStart: nextWeekStart }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));

    await waitFor(() => {
      expect(getWeeklyAssignmentsMock).toHaveBeenCalledWith(
        expect.objectContaining({ weekStart: oneWeekBeforeCurrent }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Hoy' }));

    await waitFor(() => {
      expect(getWeeklyAssignmentsMock).toHaveBeenCalled();
    });
  });

  it('el buscador filtra colaboradores por nombre/documento', async () => {
    renderScreen();
    await screen.findByText('ANA PEREZ');
    getWeeklyAssignmentsMock.mockClear();

    fireEvent.change(screen.getByPlaceholderText('Nombre o documento'), {
      target: { value: 'ana' },
    });

    await waitFor(() => {
      expect(getWeeklyAssignmentsMock).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'ana' }),
      );
    });
  });

  it('al hacer click en una celda abre el modal de asignación', async () => {
    renderScreen();
    await screen.findByText('ANA PEREZ');

    const baseCells = screen.getAllByText('Descanso + Turno Base');
    fireEvent.click(baseCells[0]);

    expect(await screen.findByRole('heading', { name: 'Asignar turno' })).toBeInTheDocument();
  });

  it('asignar un turno llama a la API y refresca la celda', async () => {
    assignTurnoMock.mockResolvedValue({
      id: 'assignment-3',
      employeeId: 'emp-1',
      workDate: '2026-07-06',
      type: 'ASSIGNED',
      turno: {
        id: 'turno-1',
        nombre: 'Turno mañana',
        sigla: 'TM',
        horaInicio: '06:00',
        horaFin: '14:00',
        jornada: 'DIURNO',
      },
      createdAt: '',
      updatedAt: '',
    });

    renderScreen();
    await screen.findByText('ANA PEREZ');

    const baseCells = screen.getAllByText('Descanso + Turno Base');
    fireEvent.click(baseCells[0]);
    await screen.findByRole('heading', { name: 'Asignar turno' });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(assignTurnoMock.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          employeeId: 'emp-1',
          workDate: '2026-07-06',
          turnoId: 'turno-1',
        }),
      );
    });
  });

  it('la selección múltiple actualiza el contador de seleccionados', async () => {
    renderScreen();
    await screen.findByText('ANA PEREZ');

    expect(screen.getByText('Seleccionados (0)')).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(screen.getByText('Seleccionados (1)')).toBeInTheDocument();

    fireEvent.click(checkbox);
    expect(screen.getByText('Seleccionados (0)')).toBeInTheDocument();
  });
});
