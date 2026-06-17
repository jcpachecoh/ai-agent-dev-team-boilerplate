import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { computeStatusCounts, useDashboardLayoutStore } from '@/stores/dashboard-layout.store';
import { useSessionStore } from '@/stores/session.store';
import { ActivePhaseScreen } from './ActivePhaseScreen';
import { WorkstationGrid } from './components/WorkstationGrid';

vi.mock('@/hooks/usePlantSocket', () => ({
  usePlantSocket: vi.fn(),
}));

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
    const { assignOrderToCell, setLayoutMode } = useDashboardLayoutStore.getState();
    assignOrderToCell(2, 'OP-000014');
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
      cells: Array.from({ length: 4 }, (_, cellIndex) => ({
        cellIndex,
        status: 'empty' as const,
      })),
    });
  });

  it('renders dashboard header and workstation grid', () => {
    render(<ActivePhaseScreen />);

    expect(screen.getByTestId('active-phase-screen')).toBeInTheDocument();
    expect(screen.getByTestId('plant-dashboard-header')).toBeInTheDocument();
    expect(screen.getByTestId('workstation-grid')).toBeInTheDocument();
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('opens assign modal when empty slot is tapped', async () => {
    const user = userEvent.setup();
    render(<ActivePhaseScreen />);

    const emptySlots = await screen.findAllByTestId('workstation-empty-slot');
    await user.click(emptySlots[0]);

    expect(screen.getByTestId('plant-order-assign-modal')).toBeInTheDocument();
    expect(screen.getByText(/asignar orden de producción/i)).toBeInTheDocument();
    expect(screen.getByText(/celda 1/i)).toBeInTheDocument();
  });

  it('assigns order to cell and closes modal', async () => {
    const user = userEvent.setup();
    render(<ActivePhaseScreen />);

    await user.click(screen.getAllByTestId('workstation-empty-slot')[0]);
    await user.click(screen.getByText('OP-000012'));

    expect(screen.queryByTestId('plant-order-assign-modal')).not.toBeInTheDocument();
    expect(screen.getByText('Pollo asado porcionado')).toBeInTheDocument();
  });

  it('updates cell when socket changes order status', () => {
    useDashboardLayoutStore.getState().hydrateDemoAssignments();
    const { rerender } = render(<ActivePhaseScreen />);

    useDashboardLayoutStore.getState().updateCellStatus('OP-000014', 'in_progress');
    rerender(<ActivePhaseScreen />);

    expect(screen.getAllByText('EN PROCESO').length).toBeGreaterThan(0);
  });

  it('shows layout mode fab', () => {
    render(<ActivePhaseScreen />);
    expect(screen.getByTestId('plant-layout-mode-fab')).toBeInTheDocument();
  });
});
