import { Navigate, Route, Routes } from 'react-router-dom';

import {
  EmployeePositionsListScreen,
  PayrollEmployeeProfileScreen,
  PayrollEmployeesListScreen,
  PayrollLegalParametersScreen,
  PayrollReportsScreen,
} from '@/features/payroll';
import { RedirectLegacyPayrollAttendance } from '@/pages/AttendancePage/AttendancePage';
import ModulePlaceholderPage from '@/pages/ModulePlaceholderPage';

export default function PayrollPage(): React.JSX.Element {
  return (
    <Routes>
      <Route index element={<PayrollReportsScreen />} />
      <Route path="reports" element={<PayrollReportsScreen />} />
      <Route path="employees" element={<PayrollEmployeesListScreen />} />
      <Route path="employees/:userId/profile" element={<PayrollEmployeeProfileScreen />} />
      <Route path="positions" element={<EmployeePositionsListScreen />} />
      <Route path="attendance/*" element={<RedirectLegacyPayrollAttendance />} />
      <Route path="salaries" element={<ModulePlaceholderPage title="Salarios" />} />
      <Route path="legal-parameters" element={<PayrollLegalParametersScreen />} />
      <Route path="*" element={<Navigate to="/payroll" replace />} />
    </Routes>
  );
}
