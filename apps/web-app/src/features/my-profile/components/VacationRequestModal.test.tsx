import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as vacationDisplayUtils from '@/features/payroll/utils/vacation-display.utils';

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

  describe('reglas de antelación', () => {
    it('establece la fecha mínima de inicio en hoy + 15 días', () => {
      vi.spyOn(vacationDisplayUtils, 'getMinVacationStartDateString').mockReturnValue('2026-07-29');

      render(<VacationRequestModal open employeeId="emp-1" availableDays={15} onClose={vi.fn()} />);

      const startInput = document.querySelector('input[type="date"]');
      expect(startInput).toHaveAttribute('min', '2026-07-29');
    });

    it('rechaza fechas de inicio dentro de los próximos 15 días', async () => {
      vi.spyOn(vacationDisplayUtils, 'getMinVacationStartDateString').mockReturnValue('2026-07-29');

      render(<VacationRequestModal open employeeId="emp-1" availableDays={15} onClose={vi.fn()} />);

      const [startInput, endInput] = document.querySelectorAll('input[type="date"]');
      fireEvent.change(startInput!, { target: { value: '2026-07-20' } });
      fireEvent.change(endInput!, { target: { value: '2026-07-24' } });
      fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }));

      await waitFor(() => {
        expect(
          screen.getByText('La fecha de inicio debe ser al menos 15 días después de hoy'),
        ).toBeInTheDocument();
      });
    });
  });
});
