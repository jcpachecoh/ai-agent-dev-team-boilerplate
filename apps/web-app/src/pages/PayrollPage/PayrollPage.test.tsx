import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import PayrollPage from './PayrollPage';

vi.mock('@/features/payroll', () => ({
  PayrollEmployeesListScreen: () => <div>Payroll Employees Screen</div>,
}));

describe('PayrollPage', () => {
  it('redirects /payroll to employees route', async () => {
    render(
      <MemoryRouter initialEntries={['/payroll']}>
        <Routes>
          <Route path="/payroll/*" element={<PayrollPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Payroll Employees Screen')).toBeInTheDocument();
  });

  it('renders salaries placeholder route', async () => {
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
