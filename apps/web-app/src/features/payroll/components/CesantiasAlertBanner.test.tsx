import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { CesantiasAlertBanner } from './CesantiasAlertBanner';
import type { CesantiasAlertSummary } from '../types/cesantias.types';

const getCesantiasAlertSummaryMock = vi.fn();

vi.mock('../api/cesantias.client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/cesantias.client')>();
  return {
    ...actual,
    getCesantiasAlertSummary: (...args: unknown[]) => getCesantiasAlertSummaryMock(...args),
  };
});

const navigateMock = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function buildSummary(overrides: Partial<CesantiasAlertSummary> = {}): CesantiasAlertSummary {
  return {
    targetYear: 2025,
    deadlineDate: '2026-02-14',
    pendingCount: 3,
    daysUntilDeadline: 10,
    status: 'PROXIMA_A_VENCER',
    ...overrides,
  };
}

function renderBanner() {
  return render(
    <MemoryRouter>
      <CesantiasAlertBanner />
    </MemoryRouter>,
  );
}

describe('CesantiasAlertBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('se oculta cuando no existen liquidaciones pendientes (COMPLETADA)', async () => {
    getCesantiasAlertSummaryMock.mockResolvedValue(
      buildSummary({ status: 'COMPLETADA', pendingCount: 0 }),
    );

    const { container } = renderBanner();

    await waitFor(() => expect(getCesantiasAlertSummaryMock).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('muestra la cantidad de pendientes y la fecha límite cuando el estado es PROXIMA_A_VENCER', async () => {
    getCesantiasAlertSummaryMock.mockResolvedValue(
      buildSummary({ status: 'PROXIMA_A_VENCER', pendingCount: 3, targetYear: 2025 }),
    );

    renderBanner();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/3 liquidacion(es)? de 2025 sin/);
    expect(screen.getByText('Consignación próxima a vencer')).toBeInTheDocument();
  });

  it('muestra el estado VENCE_HOY', async () => {
    getCesantiasAlertSummaryMock.mockResolvedValue(
      buildSummary({ status: 'VENCE_HOY', pendingCount: 1 }),
    );

    renderBanner();

    expect(await screen.findByText('Consignación vence hoy')).toBeInTheDocument();
  });

  it('muestra el estado VENCIDA', async () => {
    getCesantiasAlertSummaryMock.mockResolvedValue(
      buildSummary({ status: 'VENCIDA', pendingCount: 4, daysUntilDeadline: -3 }),
    );

    renderBanner();

    expect(await screen.findByText('Consignación vencida')).toBeInTheDocument();
  });

  it('muestra el estado PENDIENTE (pendientes pero fuera de la ventana de 15 días)', async () => {
    getCesantiasAlertSummaryMock.mockResolvedValue(
      buildSummary({ status: 'PENDIENTE', pendingCount: 2, daysUntilDeadline: 200 }),
    );

    renderBanner();

    expect(await screen.findByText('Liquidaciones pendientes')).toBeInTheDocument();
  });

  it('el botón "Ver cesantías" navega a /payroll/cesantias', async () => {
    getCesantiasAlertSummaryMock.mockResolvedValue(buildSummary());

    renderBanner();

    const linkButton = await screen.findByRole('button', { name: 'Ver cesantías' });
    fireEvent.click(linkButton);

    expect(navigateMock).toHaveBeenCalledWith('/payroll/cesantias');
  });

  it('no calcula la fecha límite en el cliente — usa exactamente lo que devuelve el backend (año 2027)', async () => {
    const summary = buildSummary({ deadlineDate: '2027-02-14', targetYear: 2026 });
    getCesantiasAlertSummaryMock.mockResolvedValue(summary);

    renderBanner();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/liquidacion(es)? de 2026 sin/);
    // Solo se verifica que el año del deadline devuelto por el backend (2027) aparece tal
    // cual — no se reimplementa el formateo exacto de fecha aquí (ver
    // formatCesantiasDeadlineDate).
    expect(alert.textContent).toContain('2027');
  });
});
