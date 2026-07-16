import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';

import { ThemeProvider } from '@/providers/ThemeProvider/ThemeProvider';

import { PayrollEmployeePaymentsTab } from './PayrollEmployeePaymentsTab';
import type { TaxWithholdingBreakdown } from '../types/payroll-reports.types';

const getPayrollReportMock = vi.fn();

vi.mock('../api/payroll.client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/payroll.client')>();
  return {
    ...actual,
    getPayrollReport: (query: Parameters<typeof actual.getPayrollReport>[0]) =>
      getPayrollReportMock(query) as ReturnType<typeof actual.getPayrollReport>,
  };
});

vi.mock('../hooks/usePayrollEmployeeQuery', () => ({
  usePayrollEmployeeQuery: () => ({
    data: { id: 'emp-details-1', name: 'Ana Pérez' },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('../hooks/useEmployeePaymentHistoryQuery', () => ({
  useEmployeePaymentHistoryQuery: () => ({
    data: {
      pages: [
        {
          edges: [
            {
              id: 'pay-1',
              tenantId: 'tenant-1',
              financialProfileId: 'profile-1',
              periodYear: 2026,
              periodMonth: 6,
              grossAmount: 5_000_000,
              totalDeductions: 800_000,
              netAmount: 4_200_000,
              paymentDate: '2026-06-30T00:00:00.000Z',
              paymentMethod: 'BANK_TRANSFER',
              status: 'PAID',
              transactionReference: 'TRX-001',
              createdAt: '2026-06-30T00:00:00.000Z',
              updatedAt: '2026-06-30T00:00:00.000Z',
            },
          ],
        },
      ],
    },
    isLoading: false,
    isError: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  }),
}));

function buildBreakdown(overrides: Partial<TaxWithholdingBreakdown> = {}): TaxWithholdingBreakdown {
  return {
    taxWithholdingBase: 4_730_400,
    uvtValue: 49_799,
    taxWithholdingBaseUvt: 95.0001,
    bracketLowerUvtExclusive: 95,
    bracketUpperUvtInclusive: 150,
    marginalRate: 0.19,
    fixedTaxUvt: 18.05,
    incomeTaxWithholding: 450_123,
    isExemptFromTax: false,
    ...overrides,
  };
}

function renderTab(): ReturnType<typeof render> {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider initialTheme="dark">
        <PayrollEmployeePaymentsTab userId="user-1" theme="dark" />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('PayrollEmployeePaymentsTab — liquidación detail', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
    getPayrollReportMock.mockResolvedValue({
      tenantId: 'tenant-1',
      period: { year: 2026, month: 6 },
      employees: [{ taxWithholdingBreakdown: buildBreakdown() }],
      tenantTotals: {
        employeeCount: 1,
        totalGrossPay: 5_000_000,
        totalDeductions: 800_000,
        totalNetPay: 4_200_000,
        totalEmployerContributions: 0,
        totalPayrollCost: 5_000_000,
      },
      locationTotals: [],
    });
  });

  it('opens liquidation detail and renders tax withholding breakdown from API', async (): Promise<void> => {
    renderTab();

    fireEvent.click(screen.getByRole('button', { name: /Ver detalle de liquidación Junio 2026/i }));

    await waitFor(() => {
      expect(getPayrollReportMock).toHaveBeenCalledWith({
        period: '2026-06',
        employeeId: 'emp-details-1',
      });
    });

    expect(
      await screen.findByRole('heading', { name: 'Liquidación Junio 2026' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Retención en la fuente' })).toBeInTheDocument();
    expect(screen.getByText('Base gravable')).toBeInTheDocument();
    expect(screen.getByText('UVT aplicadas')).toBeInTheDocument();
    expect(screen.getByText('Tramo aplicado')).toBeInTheDocument();
    expect(screen.getByText('Retención calculada')).toBeInTheDocument();
  });

  it('renders exempt breakdown inside liquidation detail', async (): Promise<void> => {
    getPayrollReportMock.mockResolvedValue({
      tenantId: 'tenant-1',
      period: { year: 2026, month: 6 },
      employees: [
        {
          taxWithholdingBreakdown: buildBreakdown({
            incomeTaxWithholding: 0,
            isExemptFromTax: true,
            bracketLowerUvtExclusive: null,
            bracketUpperUvtInclusive: null,
            marginalRate: null,
            fixedTaxUvt: null,
          }),
        },
      ],
      tenantTotals: {
        employeeCount: 1,
        totalGrossPay: 0,
        totalDeductions: 0,
        totalNetPay: 0,
        totalEmployerContributions: 0,
        totalPayrollCost: 0,
      },
      locationTotals: [],
    });

    renderTab();
    fireEvent.click(screen.getByRole('button', { name: /Ver detalle de liquidación Junio 2026/i }));

    expect(await screen.findByText('No aplica — empleado exento')).toBeInTheDocument();
  });
});
