import { Navigate, Route, Routes } from 'react-router-dom';

import { PayrollEmployeesListScreen } from '@/features/payroll';
import { AttendanceMonitorScreen } from '@/features/attendance';
import ModulePlaceholderPage from '@/pages/ModulePlaceholderPage';

export default function PayrollPage(): React.JSX.Element {
  return (
    <Routes>
      <Route index element={<Navigate to="employees" replace />} />
      <Route path="employees" element={<PayrollEmployeesListScreen />} />
      <Route path="attendance" element={<AttendanceMonitorScreen />} />
      <Route path="salaries" element={<ModulePlaceholderPage title="Salarios" />} />
      <Route path="*" element={<Navigate to="employees" replace />} />
    </Routes>
  );
}
