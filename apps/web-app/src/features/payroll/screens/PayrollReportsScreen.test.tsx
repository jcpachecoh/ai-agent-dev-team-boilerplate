import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { PayrollReportsScreen } from './PayrollReportsScreen';
import type {
  AttendanceReportResponse,
  PayrollReportResponse,
  SenaQuotaResponse,
} from '../types/payroll-reports.types';

const getPayrollReportMock = vi.fn();
const getAttendanceReportMock = vi.fn();
const getSenaQuotaMock = vi.fn();

vi.mock('../api/payroll.client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/payroll.client')>();
  return {
    ...actual,
    getPayrollReport: (...args: unknown[]) =>
      getPayrollReportMock(...args) as Promise<PayrollReportResponse>,
    getAttendanceReport: (...args: unknown[]) =>
      getAttendanceReportMock(...args) as Promise<AttendanceReportResponse>,
    getSenaQuota: (...args: unknown[]) => getSenaQuotaMock(...args) as Promise<SenaQuotaResponse>,
  };
});

vi.mock('../components/PilaPeriodPanel', () => ({
  PilaPeriodPanel: ({ period }: { period: string }) => (
    <div data-testid="pila-period-panel">PILA {period}</div>
  ),
}));

vi.mock('@/features/sedes/hooks/useLocations', () => ({
  useLocations: () => ({ data: [], isLoading: false, isError: false }),
}));

function buildPayrollReport(): PayrollReportResponse {
  return {
    tenantId: 'tenant-1',
    period: { year: 2026, month: 7 },
    employees: [],
    tenantTotals: {
      employeeCount: 0,
      totalGrossPay: 0,
      totalDeductions: 0,
      totalNetPay: 0,
      totalEmployerContributions: 0,
      totalPayrollCost: 0,
    },
    locationTotals: [],
  };
}

function buildAttendanceReport(): AttendanceReportResponse {
  return {
    tenantId: 'tenant-1',
    from: '2026-07-01',
    to: '2026-07-31',
    employees: [],
  };
}

function buildSenaQuota(overrides: Partial<SenaQuotaResponse> = {}): SenaQuotaResponse {
  return {
    period: '2026-07',
    eligibleWorkers: 15,
    requiredApprentices: 1,
    activeApprentices: 0,
    missingApprentices: 1,
    smlv: 1_750_905,
    monetizationRegime: 'LEY_2466_2025',
    estimatedMonetizationAmount: Math.round(1_750_905 * 1.5),
    status: 'PENDING',
    estimated: true,
    ...overrides,
  };
}

function renderScreen(): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <PayrollReportsScreen />
    </MemoryRouter>,
  );
}

describe('PayrollReportsScreen — aislamiento SENA/PILA (OS-599)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAttendanceReportMock.mockResolvedValue(buildAttendanceReport());
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('1024px'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('cuando falla payroll, SenaQuotaPanel sigue renderizándose', async () => {
    getPayrollReportMock.mockRejectedValue(new Error('payroll down'));
    getSenaQuotaMock.mockResolvedValue(buildSenaQuota());

    renderScreen();

    expect(
      await screen.findByText(/No se pudieron cargar los reportes de nómina/i),
    ).toBeInTheDocument();
    expect(await screen.findByLabelText('Cumplimiento cuota SENA')).toBeInTheDocument();
    expect(screen.getByTestId('pila-period-panel')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Cumplimiento cuota SENA')).toHaveLength(1);
  });

  it('cuando SENA responde y payroll falla, se muestra el resultado SENA', async () => {
    getPayrollReportMock.mockRejectedValue(new Error('payroll down'));
    getSenaQuotaMock.mockResolvedValue(buildSenaQuota({ status: 'PENDING' }));

    renderScreen();

    expect(await screen.findByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Cumplimiento cuota SENA')).toBeInTheDocument();
    expect(screen.getByText('Trabajadores computables')).toBeInTheDocument();
    expect(screen.getByText(/No se pudieron cargar los reportes de nómina/i)).toBeInTheDocument();
  });

  it('cuando SENA falla y payroll funciona, solo el panel SENA muestra error', async () => {
    getPayrollReportMock.mockResolvedValue(buildPayrollReport());
    getSenaQuotaMock.mockRejectedValue(new Error('sena down'));

    renderScreen();

    await waitFor(() => {
      expect(
        screen.queryByText(/No se pudieron cargar los reportes de nómina/i),
      ).not.toBeInTheDocument();
    });

    const senaPanel = await screen.findByLabelText('Cumplimiento cuota SENA');
    expect(
      within(senaPanel).getByText(/No se pudo cargar la estimación de cuota SENA/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId('pila-period-panel')).toBeInTheDocument();
  });

  it('al cambiar el período, la consulta SENA se actualiza', async () => {
    getPayrollReportMock.mockRejectedValue(new Error('payroll down'));
    getSenaQuotaMock.mockImplementation((period: string) =>
      Promise.resolve(buildSenaQuota({ period })),
    );

    renderScreen();

    await waitFor(() => {
      expect(getSenaQuotaMock).toHaveBeenCalled();
    });
    const initialPeriod = String(getSenaQuotaMock.mock.calls.at(-1)?.[0]);
    expect(initialPeriod).toMatch(/^\d{4}-\d{2}$/);

    const dateInputs = screen.getAllByDisplayValue(/^\d{4}-\d{2}-\d{2}$/);
    const desde = dateInputs[0];
    if (!desde) {
      throw new Error('Expected Desde date input');
    }

    const nextPeriod = initialPeriod === '2026-06' ? '2026-07' : '2026-06';
    fireEvent.change(desde, { target: { value: `${nextPeriod}-01` } });

    await waitFor(() => {
      expect(getSenaQuotaMock).toHaveBeenCalledWith(nextPeriod);
    });
    expect(screen.getAllByLabelText('Cumplimiento cuota SENA')).toHaveLength(1);
    expect(screen.getAllByTestId('pila-period-panel')).toHaveLength(1);
  });

  it('no duplica paneles SENA durante loading de payroll', async () => {
    getPayrollReportMock.mockImplementation(
      () =>
        new Promise<PayrollReportResponse>(() => {
          /* pending */
        }),
    );
    getSenaQuotaMock.mockResolvedValue(buildSenaQuota());

    renderScreen();

    expect(await screen.findByText(/Cargando reportes de nómina/i)).toBeInTheDocument();
    expect(await screen.findByLabelText('Cumplimiento cuota SENA')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Cumplimiento cuota SENA')).toHaveLength(1);
    expect(screen.getAllByTestId('pila-period-panel')).toHaveLength(1);
  });
});
