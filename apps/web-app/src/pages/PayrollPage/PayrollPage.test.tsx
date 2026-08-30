import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import PayrollPage from './PayrollPage';

vi.mock('@/features/payroll', () => ({
  PayrollEmployeesListScreen: () => <div>Payroll Employees Screen</div>,
  PayrollReportsScreen: () => <div>Payroll Reports Screen</div>,
}));

describe('PayrollPage', () => {
  it('renders payroll reports on index route', async () => {
    render(
      <MemoryRouter initialEntries={['/payroll']}>
        <Routes>
          <Route path="/payroll/*" element={<PayrollPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Payroll Reports Screen')).toBeInTheDocument();
  });

  it('redirects unknown payroll routes to employees', async () => {
    render(
      <MemoryRouter initialEntries={['/payroll/salaries']}>
        <Routes>
          <Route path="/payroll/*" element={<PayrollPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Salarios' })).toBeInTheDocument();
  });
});
