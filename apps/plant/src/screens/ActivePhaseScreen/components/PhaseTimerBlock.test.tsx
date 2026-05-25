import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useTimerStore } from '@/stores/timer.store';
import { PhaseTimerBlock } from './PhaseTimerBlock';

const STANDARD_MS = 15 * 60 * 1000;

describe('PhaseTimerBlock', () => {
  beforeEach(() => {
    useTimerStore.setState({
      status: 'idle',
      elapsedMs: 0,
      startedAt: null,
      lastTickAt: null,
      intervalId: null,
    });
  });

  it('shows mm:ss elapsed and alert tag when over standard time', () => {
    useTimerStore.setState({ elapsedMs: STANDARD_MS });
    const { rerender } = render(<PhaseTimerBlock standardDurationMs={STANDARD_MS} theme="dark" />);

    expect(screen.getByText('15:00')).toBeInTheDocument();
    expect(screen.getByText(/tiempo estándar/i)).toBeInTheDocument();
    expect(screen.getByText(/alerta/i)).toBeInTheDocument();
    expect(screen.getByTestId('phase-timer-over')).toBeInTheDocument();

    useTimerStore.setState({ elapsedMs: STANDARD_MS * 0.85 });
    rerender(<PhaseTimerBlock standardDurationMs={STANDARD_MS} theme="dark" />);
    expect(screen.getByTestId('phase-timer-warning')).toBeInTheDocument();
    expect(screen.getByText(/alerta/i)).toBeInTheDocument();

    useTimerStore.setState({ elapsedMs: STANDARD_MS * 0.5 });
    rerender(<PhaseTimerBlock standardDurationMs={STANDARD_MS} theme="dark" />);
    expect(screen.getByTestId('phase-timer-on-time')).toBeInTheDocument();
  });
});
