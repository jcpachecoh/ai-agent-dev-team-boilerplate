import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { OvertimeObjectModal } from './OvertimeObjectModal';

describe('OvertimeObjectModal', () => {
  it('valida comentario obligatorio', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<OvertimeObjectModal open onClose={() => undefined} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Objetar' }));

    expect(screen.getByText('El comentario es obligatorio.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
