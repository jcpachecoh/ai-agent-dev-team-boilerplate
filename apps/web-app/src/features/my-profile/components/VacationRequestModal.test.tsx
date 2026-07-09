import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { VacationRequestModal } from './VacationRequestModal';

vi.mock('../hooks/useVacationMutations', () => ({
  useRequestVacationMutation: () => ({
    mutateAsync: vi.fn(),
  }),
}));

vi.mock('@/providers/ThemeProvider', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

describe('VacationRequestModal', () => {
  it('valida fechas requeridas antes de enviar', async () => {
    const user = userEvent.setup();

    render(<VacationRequestModal open employeeId="emp-1" availableDays={15} onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }));

    expect(screen.getByText('Fecha de inicio requerida')).toBeInTheDocument();
    expect(screen.getByText('Fecha de fin requerida')).toBeInTheDocument();
  });
});
