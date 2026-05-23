import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TripActionButton } from '@restopsiq/ui';
import { DoubleTapActionButton } from './DoubleTapActionButton';

// lucide-react v0.511 targets React 19 — stub UI components to avoid incompatibility in jsdom/React 18
vi.mock('@restopsiq/ui', () => ({
  TripActionButton: ({
    label,
    onClick,
  }: {
    label?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
  }) => <button onClick={onClick}>{label}</button>,
}));

describe('DoubleTapActionButton', () => {
  it('requires two taps before confirming', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <DoubleTapActionButton onConfirm={onConfirm}>
        {({ onClick }) => (
          <TripActionButton theme="dark" variant="pause" label="Pausar" onClick={onClick} />
        )}
      </DoubleTapActionButton>,
    );

    const button = screen.getByRole('button', { name: /pausar/i });
    await user.click(button);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent(/toca de nuevo/i);

    await user.click(button);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
