import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { PayrollEmployeeDotacionesTab } from './PayrollEmployeeDotacionesTab';

vi.mock('../hooks/usePayrollEmployeeQuery', () => ({
  usePayrollEmployeeQuery: vi.fn(),
}));

vi.mock('../hooks/useDotacionesQuery', () => ({
  useEmployeeDotacionHistoryQuery: vi.fn(),
}));

vi.mock('./PayrollEmployeeProfileTabLoading', () => ({
  PayrollEmployeeProfileTabLoading: () => <div data-testid="tab-loading" />,
}));

vi.mock('./EmployeeDotacionModal', () => ({
  EmployeeDotacionModal: () => null,
}));

vi.mock('@/features/auth/hooks/useMe', () => ({
  useMe: vi.fn(() => ({ data: { roleCode: 'ADMIN' } })),
}));

vi.mock('@/lib/auth-token', () => ({
  getRoleCodeFromToken: vi.fn(() => 'ADMIN'),
}));

vi.mock('@/config/rbac.config', () => ({
  canWritePayrollEmployee: vi.fn(() => false),
}));

import { usePayrollEmployeeQuery } from '../hooks/usePayrollEmployeeQuery';
import { useEmployeeDotacionHistoryQuery } from '../hooks/useDotacionesQuery';
import type { DotacionDelivery, DotacionPage } from '../types/dotaciones.types';

const EMPLOYEE_STUB = {
  id: 'emp-001',
  name: 'Ana García',
  position: 'Cocinera',
  area: 'Cocina',
  userId: 'user-001',
};

function makeDelivery(overrides: Partial<DotacionDelivery> = {}): DotacionDelivery {
  return {
    id: 'del-001',
    tenantId: 'tenant-001',
    employeeId: 'emp-001',
    period: '2026-04',
    supplyItemId: 'item-001',
    quantity: 1,
    deliveredAt: '2026-04-25T00:00:00.000Z',
    status: 'ENTREGADA',
    signedReceiptUrl: null,
    stockMovementId: null,
    noAplicaReason: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    supplyItem: { id: 'item-001', nombre: 'Camisa blanca', talla: 'M' },
    employeeName: 'Ana García',
    ...overrides,
  };
}

function makePage(edges: DotacionDelivery[], hasNextPage = false): DotacionPage {
  return {
    edges,
    pageInfo: { hasNextPage, endCursor: hasNextPage ? 'cursor-x' : null },
  };
}

const mockedEmployeeQuery = vi.mocked(usePayrollEmployeeQuery);
const mockedHistoryQuery = vi.mocked(useEmployeeDotacionHistoryQuery);

function setupQueries(
  employeeLoading = false,
  historyLoading = false,
  page: DotacionPage | undefined = undefined,
) {
  mockedEmployeeQuery.mockReturnValue({
    data: employeeLoading ? undefined : EMPLOYEE_STUB,
    isLoading: employeeLoading,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof usePayrollEmployeeQuery>);

  mockedHistoryQuery.mockReturnValue({
    data: historyLoading ? undefined : page,
    isLoading: historyLoading,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useEmployeeDotacionHistoryQuery>);
}

describe('PayrollEmployeeDotacionesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading when employee query is loading', () => {
    setupQueries(true, false);
    render(<PayrollEmployeeDotacionesTab userId="user-001" theme="dark" />);
    expect(screen.getByTestId('tab-loading')).toBeInTheDocument();
  });

  it('shows loading when history query is loading', () => {
    setupQueries(false, true);
    render(<PayrollEmployeeDotacionesTab userId="user-001" theme="dark" />);
    expect(screen.getByTestId('tab-loading')).toBeInTheDocument();
  });

  it('shows empty state when no deliveries exist', () => {
    setupQueries(false, false, makePage([]));
    render(<PayrollEmployeeDotacionesTab userId="user-001" theme="dark" />);
    expect(screen.getByText('Sin registros de dotación')).toBeInTheDocument();
  });

  it('renders delivery card with period, item and status', () => {
    setupQueries(false, false, makePage([makeDelivery()]));
    render(<PayrollEmployeeDotacionesTab userId="user-001" theme="dark" />);

    expect(screen.getByText('2026-04')).toBeInTheDocument();
    expect(screen.getByText('Camisa blanca · Talla M')).toBeInTheDocument();
    expect(screen.getByText('Entregada')).toBeInTheDocument();
  });

  it('shows PENDIENTE badge for pending delivery', () => {
    setupQueries(
      false,
      false,
      makePage([makeDelivery({ status: 'PENDIENTE', deliveredAt: null })]),
    );
    render(<PayrollEmployeeDotacionesTab userId="user-001" theme="dark" />);
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('shows NO_APLICA badge and reason', () => {
    setupQueries(
      false,
      false,
      makePage([
        makeDelivery({
          status: 'NO_APLICA',
          deliveredAt: null,
          noAplicaReason: 'Ingresó en diciembre',
        }),
      ]),
    );
    render(<PayrollEmployeeDotacionesTab userId="user-001" theme="dark" />);
    expect(screen.getByText('No aplica')).toBeInTheDocument();
    expect(screen.getByText(/Ingresó en diciembre/)).toBeInTheDocument();
  });

  it('shows "Sin ítem asignado" when supplyItem is null', () => {
    setupQueries(false, false, makePage([makeDelivery({ supplyItem: null, supplyItemId: null })]));
    render(<PayrollEmployeeDotacionesTab userId="user-001" theme="dark" />);
    expect(screen.getByText('Sin ítem asignado')).toBeInTheDocument();
  });

  it('renders item without talla when talla is null', () => {
    setupQueries(
      false,
      false,
      makePage([makeDelivery({ supplyItem: { id: 'item-001', nombre: 'Botas', talla: null } })]),
    );
    render(<PayrollEmployeeDotacionesTab userId="user-001" theme="dark" />);
    expect(screen.getByText('Botas')).toBeInTheDocument();
  });

  it('shows receipt link when signedReceiptUrl is present', () => {
    setupQueries(
      false,
      false,
      makePage([makeDelivery({ signedReceiptUrl: 'https://storage.example.com/receipt.pdf' })]),
    );
    render(<PayrollEmployeeDotacionesTab userId="user-001" theme="dark" />);
    const link = screen.getByText('Ver comprobante');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://storage.example.com/receipt.pdf');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('does not show receipt link when signedReceiptUrl is null', () => {
    setupQueries(false, false, makePage([makeDelivery({ signedReceiptUrl: null })]));
    render(<PayrollEmployeeDotacionesTab userId="user-001" theme="dark" />);
    expect(screen.queryByText('Ver comprobante')).not.toBeInTheDocument();
  });

  it('shows multiple delivery cards when multiple deliveries exist', () => {
    const deliveries = [
      makeDelivery({ id: 'del-001', period: '2026-04' }),
      makeDelivery({
        id: 'del-002',
        period: '2026-08',
        supplyItem: { id: 'item-002', nombre: 'Pantalón negro', talla: '32' },
      }),
    ];
    setupQueries(false, false, makePage(deliveries));
    render(<PayrollEmployeeDotacionesTab userId="user-001" theme="dark" />);

    expect(screen.getByText('2026-04')).toBeInTheDocument();
    expect(screen.getByText('2026-08')).toBeInTheDocument();
    expect(screen.getByText('Pantalón negro · Talla 32')).toBeInTheDocument();
  });

  it('shows load more button when hasNextPage is true', () => {
    setupQueries(false, false, makePage([makeDelivery()], true));
    render(<PayrollEmployeeDotacionesTab userId="user-001" theme="dark" />);
    expect(screen.getByText('Cargar más')).toBeInTheDocument();
  });

  it('hides load more button when hasNextPage is false', () => {
    setupQueries(false, false, makePage([makeDelivery()], false));
    render(<PayrollEmployeeDotacionesTab userId="user-001" theme="dark" />);
    expect(screen.queryByText('Cargar más')).not.toBeInTheDocument();
  });
});
