import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { computeStatusCounts, useDashboardLayoutStore } from '@/stores/dashboard-layout.store';
import { useSessionStore } from '@/stores/session.store';
import { ActivePhaseScreen } from './ActivePhaseScreen';
import { WorkstationGrid } from './components/WorkstationGrid';

vi.mock('@/hooks/usePlantSocket', () => ({
  usePlantSocket: vi.fn(),
}));

vi.mock('@/hooks/useAvailableProductionOrders', () => ({
  useAvailableProductionOrders: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  })),
}));

vi.mock('@/hooks/useOrderLiveStatus', () => ({
  useOrderLiveStatus: vi.fn(() => ({ data: undefined })),
}));

vi.mock('@/hooks/useWorkstationOrderRuntime', () => ({
  useWorkstationOrderRuntime: vi.fn(() => ({
    displayStatus: 'pending',
    elapsedMs: 0,
    timerRunning: false,
    handleStart: vi.fn(),
    handlePause: vi.fn(),
    handleResume: vi.fn(),
    handleNextStep: vi.fn(),
    handleFinish: vi.fn(),
    isPending: false,
    canStart: true,
    canAdvanceStep: true,
    isRecipeLoading: false,
  })),
}));

vi.mock('@/providers/ThemeProvider', () => ({
  useTheme: () => ({ theme: 'dark' as const, toggleTheme: vi.fn() }),
}));

vi.mock('@/services/incident.service', () => ({
  fetchOrderNovelties: vi.fn().mockResolvedValue([]),
  reportOrderNovelty: vi.fn(),
}));

import { useAvailableProductionOrders } from '@/hooks/useAvailableProductionOrders';
import { DEMO_AVAILABLE_ORDERS } from '@/stores/dashboard-layout.store';

function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    queryClient,
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
  };
}

describe('dashboard-layout store', () => {
  beforeEach(() => {
    localStorage.clear();
    useDashboardLayoutStore.setState({
      layoutMode: '2x2',
      cells: Array.from({ length: 4 }, (_, cellIndex) => ({
        cellIndex,
        status: 'empty' as const,
      })),
    });
  });

  it('persists layout mode in localStorage', () => {
    useDashboardLayoutStore.getState().setLayoutMode('1x2');
    expect(localStorage.getItem('plant.dashboard.layoutMode')).toBe('1x2');
  });

  it('keeps hidden cell assignments when reducing layout', () => {
    useDashboardLayoutStore.setState({ availableOrders: DEMO_AVAILABLE_ORDERS });
    const { assignOrderToCell, setLayoutMode } = useDashboardLayoutStore.getState();
    const order = DEMO_AVAILABLE_ORDERS.find((item) => item.orderId === 'OP-000014');
    if (!order) throw new Error('Demo order OP-000014 not found');
    assignOrderToCell(2, order);
    setLayoutMode('1x2');

    const cells = useDashboardLayoutStore.getState().cells;
    expect(cells[2]?.orderId).toBe('OP-000014');
    expect(useDashboardLayoutStore.getState().layoutMode).toBe('1x2');
  });

  it('aggregates status counts from cells', () => {
    useDashboardLayoutStore.getState().hydrateDemoAssignments();
    const counts = computeStatusCounts(useDashboardLayoutStore.getState().cells);
    expect(counts.inProgress).toBe(1);
    expect(counts.paused).toBe(1);
    expect(counts.pending).toBe(1);
    expect(counts.incidents).toBe(1);
  });
});

describe('WorkstationGrid', () => {
  it('renders 1, 2 and 4 cells by layout mode', () => {
    const { rerender } = render(
      <WorkstationGrid layoutMode="1x1">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} data-testid={`cell-${index}`} />
        ))}
      </WorkstationGrid>,
    );
    expect(screen.getAllByTestId(/^cell-/)).toHaveLength(1);

    rerender(
      <WorkstationGrid layoutMode="1x2">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} data-testid={`cell-${index}`} />
        ))}
      </WorkstationGrid>,
    );
    expect(screen.getAllByTestId(/^cell-/)).toHaveLength(2);

    rerender(
      <WorkstationGrid layoutMode="2x2">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} data-testid={`cell-${index}`} />
        ))}
      </WorkstationGrid>,
    );
    expect(screen.getAllByTestId(/^cell-/)).toHaveLength(4);
  });
});

describe('ActivePhaseScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useSessionStore.setState({
      stationId: 'EST-02',
      operator: {
        operatorId: '1',
        operatorName: 'Carlos Mendoza',
        accessToken: 'access-token',
        role: 'OPERATOR',
        tenantId: 'tenant-abc',
        locationId: 'EST-02',
        assignedLocations: [{ id: 'EST-02', name: 'Sede Test', code: 'EST-02', city: null }],
        requiresLocationSelection: false,
      },
      isAuthenticated: true,
      sessionStartedAt: Date.now(),
    });
    useDashboardLayoutStore.setState({
      layoutMode: '2x2',
      availableOrders: DEMO_AVAILABLE_ORDERS,
      cells: Array.from({ length: 4 }, (_, cellIndex) => ({
        cellIndex,
        status: 'empty' as const,
      })),
    });
    vi.mocked(useAvailableProductionOrders).mockReturnValue({
      data: DEMO_AVAILABLE_ORDERS,
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAvailableProductionOrders>);
  });

  it('renders dashboard header and workstation grid', () => {
    renderWithProviders(<ActivePhaseScreen />);

    expect(screen.getByTestId('active-phase-screen')).toBeInTheDocument();
    expect(screen.getByTestId('plant-dashboard-header')).toBeInTheDocument();
    expect(screen.getByTestId('workstation-grid')).toBeInTheDocument();
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('opens assign modal when empty slot is tapped', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ActivePhaseScreen />);

    const emptySlots = await screen.findAllByTestId('workstation-empty-slot');
    await user.click(emptySlots[0]);

    expect(screen.getByTestId('plant-order-assign-modal')).toBeInTheDocument();
    expect(screen.getByText(/asignar orden de producción/i)).toBeInTheDocument();
    expect(screen.getByText(/celda 1/i)).toBeInTheDocument();
  });

  it('assigns order to cell and closes modal', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ActivePhaseScreen />);

    await user.click(screen.getAllByTestId('workstation-empty-slot')[0]);
    await user.click(screen.getByText('OP-000012'));

    expect(screen.queryByTestId('plant-order-assign-modal')).not.toBeInTheDocument();
    expect(screen.getByText('Pollo asado porcionado')).toBeInTheDocument();
  });

  it('updates cell when socket changes order status', () => {
    useDashboardLayoutStore.getState().hydrateDemoAssignments();
    const { queryClient, rerender } = renderWithProviders(<ActivePhaseScreen />);

    useDashboardLayoutStore.getState().updateCellStatus('OP-000014', 'in_progress');
    rerender(
      <QueryClientProvider client={queryClient}>
        <ActivePhaseScreen />
      </QueryClientProvider>,
    );

    expect(screen.getAllByText('EN PROCESO').length).toBeGreaterThan(0);
  });

  it('shows layout mode fab', () => {
    renderWithProviders(<ActivePhaseScreen />);
    expect(screen.getByTestId('plant-layout-mode-fab')).toBeInTheDocument();
  });
});
