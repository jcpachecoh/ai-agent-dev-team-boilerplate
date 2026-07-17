import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AttendanceApiError } from '../api/attendance.client';
import { OvertimeInboxScreen } from './OvertimeInboxScreen';

const useMeMock = vi.fn();
const createMutateAsyncMock = vi.fn();
const createMutationState = {
  mutateAsync: (...args: unknown[]) => createMutateAsyncMock(...args),
  isPending: false,
};

vi.mock('@/providers/ThemeProvider', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('@/features/auth/hooks/useMe', () => ({
  useMe: () => useMeMock(),
}));

vi.mock('@restopsiq/ui', async () => {
  const actual = await vi.importActual<typeof import('@restopsiq/ui')>('@restopsiq/ui');
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

vi.mock('../hooks/useOvertimeRequests', () => ({
  useOvertimeRequestsQuery: () => ({
    isLoading: false,
    isError: false,
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
          shiftEndTime: '2026-07-10T22:00:00.000Z',
          actualEndTime: '2026-07-10T22:45:00.000Z',
          status: 'PENDIENTE_ADMIN',
          payrollPeriod: '2026-07',
          createdAt: '2026-07-10T22:45:00.000Z',
          updatedAt: '2026-07-10T22:45:00.000Z',
        },
        {
          id: 'req-admin',
          employeeId: 'emp-2',
          employeeName: 'Luis',
          locationId: 'loc-1',
          locationName: 'PL-01',
          type: 'SOLICITUD_ADMINISTRATIVA',
          accumulatedMinutes: null,
          shiftEndTime: null,
          actualEndTime: null,
          proposedMinutes: 90,
          workDate: '2026-07-16',
          proposedStartTime: '2026-07-16T22:00:00.000-05:00',
          proposedEndTime: '2026-07-16T23:30:00.000-05:00',
          status: 'PENDIENTE_GERENCIA_OPERACIONES',
          payrollPeriod: '2026-07',
          createdAt: '2026-07-16T10:00:00.000Z',
          updatedAt: '2026-07-16T10:00:00.000Z',
        },
      ],
      pageInfo: { hasNextPage: false, endCursor: null },
    },
    refetch: vi.fn(),
  }),
  useOvertimePeriodSummaryQuery: () => ({
    data: { payrollPeriod: '2026-07', pendingCount: 0, approvedCount: 0, objectedCount: 0 },
  }),
  useApproveOvertimeMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useObjectOvertimeMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateAdministrativeOvertimeMutation: () => createMutationState,
}));

vi.mock('../hooks/usePayrollEmployeeQuery', () => ({
  usePayrollEmployeeQuery: () => ({ data: { positionId: null } }),
}));

vi.mock('../components/AdministrativeOvertimeRequestModal', () => ({
  AdministrativeOvertimeRequestModal: ({
    open,
    onSubmit,
    onClose,
    errorMessage,
    loading,
  }: {
    open: boolean;
    onSubmit: (input: unknown) => void;
    onClose: () => void;
    errorMessage?: string | null;
    loading?: boolean;
  }) =>
    open ? (
      <div role="dialog" aria-label="modal-admin">
        {errorMessage ? <p role="alert">{errorMessage}</p> : null}
        <button
          type="button"
          disabled={loading}
          onClick={() =>
            onSubmit({
              employeeIds: ['emp-1', 'emp-2'],
              locationId: 'loc-1',
              workDate: '2026-07-16',
              proposedStartTime: '2026-07-16T22:00:00.000-05:00',
              proposedEndTime: '2026-07-17T01:30:00.000-05:00',
              reasonOptionId: 'reason-1',
            })
          }
        >
          Crear solicitud
        </button>
        <button type="button" onClick={onClose}>
          Cancelar
        </button>
      </div>
    ) : null,
}));

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <OvertimeInboxScreen />
    </QueryClientProvider>,
  );
}

describe('OvertimeInboxScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createMutationState.isPending = false;
    useMeMock.mockReturnValue({ data: { id: 'user-1', roleCode: 'MANAGER' } });
    createMutateAsyncMock.mockResolvedValue({
      batchId: 'batch-1',
      createdCount: 2,
      items: [],
    });
  });

  it('muestra el botón con permiso efectivo request (MANAGER)', () => {
    renderScreen();
    expect(
      screen.getByRole('button', { name: 'Solicitar extensión de jornada' }),
    ).toBeInTheDocument();
  });

  it('oculta el botón con solo read (NOMINA)', () => {
    useMeMock.mockReturnValue({ data: { id: 'user-1', roleCode: 'NOMINA' } });
    renderScreen();
    expect(
      screen.queryByRole('button', { name: 'Solicitar extensión de jornada' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Tiempo extra')).toBeInTheDocument();
  });

  it('abre y cierra el formulario de solicitud', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByRole('button', { name: 'Solicitar extensión de jornada' }));
    expect(screen.getByRole('dialog', { name: 'modal-admin' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog', { name: 'modal-admin' })).not.toBeInTheDocument();
  });

  it('en éxito cierra, confirma cantidad y permite refrescar bandeja vía mutation', async () => {
    const user = userEvent.setup();
    const { toast } = await import('@restopsiq/ui');
    renderScreen();

    await user.click(screen.getByRole('button', { name: 'Solicitar extensión de jornada' }));
    await user.click(screen.getByRole('button', { name: 'Crear solicitud' }));

    await waitFor(() => {
      expect(createMutateAsyncMock).toHaveBeenCalledWith({
        employeeIds: ['emp-1', 'emp-2'],
        locationId: 'loc-1',
        workDate: '2026-07-16',
        proposedStartTime: '2026-07-16T22:00:00.000-05:00',
        proposedEndTime: '2026-07-17T01:30:00.000-05:00',
        reasonOptionId: 'reason-1',
      });
    });

    expect(toast.success).toHaveBeenCalledWith('Se crearon 2 solicitudes administrativas');
    expect(screen.queryByRole('dialog', { name: 'modal-admin' })).not.toBeInTheDocument();
  });

  it('muestra error 403/404/409 del backend sin detalles internos', async () => {
    const user = userEvent.setup();
    createMutateAsyncMock.mockRejectedValue(
      new AttendanceApiError('Ya existe una solicitud solapada o duplicada.', 409),
    );
    renderScreen();

    await user.click(screen.getByRole('button', { name: 'Solicitar extensión de jornada' }));
    await user.click(screen.getByRole('button', { name: 'Crear solicitud' }));

    expect(
      await screen.findByText('Ya existe una solicitud solapada o duplicada.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'modal-admin' })).toBeInTheDocument();
  });

  it('muestra origen administrativo y conserva detección automática', () => {
    renderScreen();
    expect(screen.getByText('Solicitud administrativa')).toBeInTheDocument();
    expect(screen.getByText('Detección automática')).toBeInTheDocument();
  });

  it('evita doble submit mientras la mutación está pendiente', async () => {
    const user = userEvent.setup();
    createMutationState.isPending = true;
    renderScreen();

    await user.click(screen.getByRole('button', { name: 'Solicitar extensión de jornada' }));
    expect(screen.getByRole('button', { name: 'Crear solicitud' })).toBeDisabled();
  });
});
