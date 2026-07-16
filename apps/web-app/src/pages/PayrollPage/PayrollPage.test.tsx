import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import PayrollPage from './PayrollPage';

vi.mock('@/features/payroll', () => ({
  CesantiasScreen: () => <div>Cesantias Screen</div>,
  EmployeePositionsListScreen: () => <div>Positions Screen</div>,
  MedicalLeavesScreen: () => <div>Medical Leaves Screen</div>,
  PayrollEmployeeProfileScreen: () => <div>Employee Profile Screen</div>,
  PayrollEmployeesListScreen: () => <div>Payroll Employees Screen</div>,
  PayrollLegalParametersScreen: () => <div>Legal Parameters Screen</div>,
  PayrollNovedadesScreen: () => <div>Novedades Screen</div>,
  PayrollReportsScreen: () => <div>Payroll Reports Screen</div>,
  RotanteAssignmentsScreen: () => <div>Rotante Assignments Screen</div>,
  VacationApprovalsScreen: () => <div>Vacations Screen</div>,
}));

vi.mock('@/pages/AttendancePage/AttendancePage', () => ({
  RedirectLegacyPayrollAttendance: () => <div>Legacy Attendance Redirect</div>,
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

  it('redirects unknown payroll routes to reports', async () => {
    render(
      <MemoryRouter initialEntries={['/payroll/salaries']}>
        <Routes>
          <Route path="/payroll/*" element={<PayrollPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Payroll Reports Screen')).toBeInTheDocument();
  });
});
