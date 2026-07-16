import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import DashboardPage from './DashboardPage';

// OS-588 (fase 4) — DashboardPage ahora también renderiza CesantiasAlertBanner, que usa
// useNavigate(); necesita contexto de router incluso en este test previamente sin rutas.
vi.mock('@/features/payroll/api/cesantias.client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/payroll/api/cesantias.client')>();
  return {
    ...actual,
    getCesantiasAlertSummary: () =>
      Promise.resolve({
        targetYear: 2025,
        deadlineDate: '2026-02-14',
        pendingCount: 0,
        daysUntilDeadline: 30,
        status: 'COMPLETADA' as const,
      }),
  };
});

vi.mock('@/features/payroll/api/pila.client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/payroll/api/pila.client')>();
  return {
    ...actual,
    getPilaDeadline: () =>
      Promise.resolve({
        period: '2026-07',
        paymentMonth: '2026-08',
        dueDate: '2026-08-04',
        businessDayNumber: 2,
        lastTwoNitDigits: '00',
        daysRemaining: 30,
        status: 'NOT_DUE' as const,
        shouldAlert: false,
        timezone: 'America/Bogota',
      }),
  };
});

describe('DashboardPage', () => {
  it('renders dashboard hero and KPI cards', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /restopsiq plant/i })).toBeInTheDocument();
    expect(screen.getByText('Estaciones Activas')).toBeInTheDocument();
    expect(screen.getByText('5/6')).toBeInTheDocument();
    expect(screen.getByText('Recetas Activas')).toBeInTheDocument();
  });
});
