import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MedicalLeave180DayBanner } from './MedicalLeave180DayBanner';
import { MEDICAL_LEAVE_180_DAY_WARNING } from '../utils/medical-leaves-display';

describe('MedicalLeave180DayBanner', () => {
  it('muestra el copy de alerta legal y el total acumulado', () => {
    render(<MedicalLeave180DayBanner annualAccumulatedDays={185} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(MEDICAL_LEAVE_180_DAY_WARNING)).toBeInTheDocument();
    expect(screen.getByText(/185/)).toBeInTheDocument();
  });
});
