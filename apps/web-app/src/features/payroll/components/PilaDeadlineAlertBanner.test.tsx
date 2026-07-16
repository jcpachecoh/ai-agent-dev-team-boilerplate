import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { PilaDeadlineAlertBanner } from './PilaDeadlineAlertBanner';
import type { PilaDeadlineResponse } from '../types/pila.types';

const usePilaDeadlineQueryMock = vi.fn();

vi.mock('../hooks/usePilaExportQueries', () => ({
  usePilaDeadlineQuery: (...args: unknown[]) => usePilaDeadlineQueryMock(...args),
}));

function buildDeadline(overrides: Partial<PilaDeadlineResponse> = {}): PilaDeadlineResponse {
  return {
    period: '2026-07',
    paymentMonth: '2026-08',
    dueDate: '2026-08-04',
    businessDayNumber: 2,
    lastTwoNitDigits: '00',
    daysRemaining: 3,
    status: 'UPCOMING',
    shouldAlert: true,
    timezone: 'America/Bogota',
    ...overrides,
  };
}

describe('PilaDeadlineAlertBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza banner cuando shouldAlert=true', () => {
    usePilaDeadlineQueryMock.mockReturnValue({
      data: buildDeadline(),
      isLoading: false,
      isError: false,
    });

    render(
      <MemoryRouter>
        <PilaDeadlineAlertBanner period="2026-07" />
      </MemoryRouter>,
    );

    expect(screen.getByText('PILA próxima a vencer')).toBeInTheDocument();
    expect(screen.getByText(/Período 2026-07/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ir a PILA' })).toBeInTheDocument();
  });

  it('no renderiza banner cuando está pagado', () => {
    usePilaDeadlineQueryMock.mockReturnValue({
      data: buildDeadline({ status: 'PAID', shouldAlert: false, daysRemaining: -2 }),
      isLoading: false,
      isError: false,
    });

    const { container } = render(
      <MemoryRouter>
        <PilaDeadlineAlertBanner period="2026-07" />
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('muestra mensaje de configuración incompleta sin fecha falsa', () => {
    usePilaDeadlineQueryMock.mockReturnValue({
      data: buildDeadline({
        status: 'CONFIG_INCOMPLETE',
        shouldAlert: false,
        dueDate: null,
        message: 'Configure el NIT del empleador',
      }),
      isLoading: false,
      isError: false,
    });

    render(
      <MemoryRouter>
        <PilaDeadlineAlertBanner period="2026-07" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Configuración PILA incompleta')).toBeInTheDocument();
    expect(screen.getByText(/Configure el NIT/)).toBeInTheDocument();
  });
});
