import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { VacationRejectModal } from './VacationRejectModal';

vi.mock('@/features/my-profile/hooks/useVacationMutations', () => ({
  useVacationApprovalMutations: () => ({
    reject: { mutateAsync: vi.fn() },
  }),
}));

vi.mock('@/providers/ThemeProvider', () => ({
  useTheme: () => ({ theme: 'dark' }),
}));

describe('VacationRejectModal', () => {
  it('valida motivo requerido antes de rechazar', async () => {
    const user = userEvent.setup();

    render(<VacationRejectModal open requestId="req-1" onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Rechazar' }));

    expect(screen.getByText('El motivo de rechazo es obligatorio')).toBeInTheDocument();
  });
});
