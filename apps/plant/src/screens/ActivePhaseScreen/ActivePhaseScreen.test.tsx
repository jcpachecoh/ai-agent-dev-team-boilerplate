import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePhaseStore } from '@/stores/phase.store';
import { useSessionStore } from '@/stores/session.store';
import { useTimerStore } from '@/stores/timer.store';
import { ActivePhaseScreen } from './ActivePhaseScreen';

vi.mock('@/hooks/usePlantSocket', () => ({
  usePlantSocket: vi.fn(),
}));

describe('ActivePhaseScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionStore.setState({
      stationId: 'EST-02',
      operator: { operatorId: '1', operatorName: 'C. Mendoza' },
      isAuthenticated: true,
      sessionStartedAt: Date.now(),
    });
    useTimerStore.setState({
      status: 'idle',
      elapsedMs: 0,
      startedAt: null,
      lastTickAt: null,
      intervalId: null,
    });
    usePhaseStore.getState().hydrateDemoPhase();
  });

  it('renders phase header, instructions and operators footer', () => {
    render(<ActivePhaseScreen />);

    expect(screen.getByTestId('active-phase-screen')).toBeInTheDocument();
    expect(screen.getByText(/urgente/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /fase 2/i })).toBeInTheDocument();
    expect(screen.getByText(/instrucciones de fase/i)).toBeInTheDocument();
    expect(screen.getByText(/operadores en turno/i)).toBeInTheDocument();
    expect(screen.getByText(/50 kg/i)).toBeInTheDocument();
  });

  it('shows Completar fase only when workflow is in_progress', () => {
    usePhaseStore.setState({ workflowStatus: 'assigned' });
    const { rerender } = render(<ActivePhaseScreen />);

    expect(screen.queryByRole('button', { name: /completar fase/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar fase/i })).toBeInTheDocument();

    usePhaseStore.setState({ workflowStatus: 'in_progress' });
    rerender(<ActivePhaseScreen />);
    expect(screen.getByRole('button', { name: /completar fase/i })).toBeInTheDocument();
  });

  it('updates OP id when phase store changes from socket handler', () => {
    const { rerender } = render(<ActivePhaseScreen />);
    expect(screen.getByText(/OP-000012/i)).toBeInTheDocument();

    usePhaseStore.setState({ opId: 'OP-000099' });
    rerender(<ActivePhaseScreen />);

    expect(screen.getByText(/OP-000099/i)).toBeInTheDocument();
  });

  it('fires onCompletePhase after double tap on Completar', async () => {
    const user = userEvent.setup();
    const onCompletePhase = vi.fn();
    usePhaseStore.setState({ workflowStatus: 'in_progress' });

    render(<ActivePhaseScreen onCompletePhase={onCompletePhase} />);

    const completeBtn = screen.getByRole('button', { name: /completar fase/i });
    await user.click(completeBtn);
    expect(onCompletePhase).not.toHaveBeenCalled();
    await user.click(completeBtn);
    expect(onCompletePhase).toHaveBeenCalledTimes(1);
  });
});
