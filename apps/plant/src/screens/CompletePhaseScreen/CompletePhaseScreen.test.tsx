import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as phaseService from '@/services/phase.service';
import { usePhaseStore } from '@/stores/phase.store';
import { useSessionStore } from '@/stores/session.store';
import { useTimerStore } from '@/stores/timer.store';
import { CompletePhaseScreen } from './CompletePhaseScreen';

vi.mock('@/services/phase.service', () => ({
  submitPhaseCompletion: vi.fn(),
}));

describe('CompletePhaseScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionStore.setState({
      stationId: 'EST-02',
      operator: {
        operatorId: '1',
        operatorName: 'C. Mendoza',
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
    useTimerStore.setState({
      status: 'running',
      elapsedMs: 928_000,
      startedAt: Date.now() - 928_000,
      lastTickAt: Date.now(),
      intervalId: null,
    });
    usePhaseStore.getState().hydrateDemoPhase();
    usePhaseStore.setState({ workflowStatus: 'in_progress' });
  });

  it('renders completion layout and summary', () => {
    render(<CompletePhaseScreen />);

    expect(screen.getByTestId('complete-phase-screen')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /completar fase/i })).toBeInTheDocument();
    expect(screen.getAllByText(/OP-000012/i).length).toBeGreaterThanOrEqual(1);
    expect(within(screen.getByTestId('quantity-display')).getByText('48.5')).toBeInTheDocument();
    expect(screen.getByText(/meta: 50\.0 kg/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmar y completar fase/i })).toBeInTheDocument();
  });

  it('switches production unit via unit toggle', async () => {
    const user = userEvent.setup();
    render(<CompletePhaseScreen />);

    const unitGroup = screen.getByRole('group', { name: /unidad de medida/i });
    await user.click(within(unitGroup).getByRole('button', { name: 'un' }));

    expect(within(screen.getByTestId('quantity-display')).getByRole('status')).toHaveTextContent(
      /un/,
    );
    expect(screen.getByText(/meta: 50\.0 un/i)).toBeInTheDocument();
  });

  it('updates quantity from keypad', async () => {
    const user = userEvent.setup();
    render(<CompletePhaseScreen />);

    await user.click(screen.getByRole('button', { name: /tecla 9/i }));

    expect(within(screen.getByTestId('quantity-display')).getByText('48.59')).toBeInTheDocument();
  });

  it('does not allow a second decimal separator', async () => {
    const user = userEvent.setup();
    render(<CompletePhaseScreen />);

    const decimal = screen.getByRole('button', { name: /separador decimal/i });
    await user.click(decimal);

    expect(within(screen.getByTestId('quantity-display')).getByText('48.5')).toBeInTheDocument();
  });

  it('disables confirm when quantity is empty', async () => {
    const user = userEvent.setup();
    render(<CompletePhaseScreen />);

    const backspace = screen.getByRole('button', { name: /borrar/i });
    for (let i = 0; i < 6; i += 1) {
      await user.click(backspace);
    }

    expect(screen.getByRole('button', { name: /confirmar y completar fase/i })).toBeDisabled();
  });

  it('calls submit after double tap on confirm', async () => {
    const user = userEvent.setup();
    vi.mocked(phaseService.submitPhaseCompletion).mockResolvedValue('synced');
    const onCompleteSuccess = vi.fn();

    render(<CompletePhaseScreen onCompleteSuccess={onCompleteSuccess} />);

    const confirmBtn = screen.getByRole('button', { name: /confirmar y completar fase/i });
    await user.click(confirmBtn);
    expect(phaseService.submitPhaseCompletion).not.toHaveBeenCalled();

    await user.click(confirmBtn);

    await waitFor(() => {
      expect(phaseService.submitPhaseCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          opId: 'OP-000012',
          stationId: 'EST-02',
          quantity: 48.5,
          unit: 'kg',
        }),
      );
    });
    expect(onCompleteSuccess).toHaveBeenCalled();
  });

  it('navigates back without clearing session', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(<CompletePhaseScreen onBack={onBack} />);

    await user.click(screen.getByRole('button', { name: /volver a la fase/i }));

    expect(onBack).toHaveBeenCalled();
    expect(useSessionStore.getState().isAuthenticated).toBe(true);
  });
});
