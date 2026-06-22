import { Navigate, Route, Routes } from 'react-router-dom';

import { PayrollEmployeesListScreen, PayrollReportsScreen } from '@/features/payroll';
import { AttendanceLocationDetailScreen, AttendanceMonitorScreen } from '@/features/attendance';
import ModulePlaceholderPage from '@/pages/ModulePlaceholderPage';

export default function PayrollPage(): React.JSX.Element {
  return (
    <Routes>
      <Route index element={<PayrollReportsScreen />} />
      <Route path="reports" element={<PayrollReportsScreen />} />
      <Route path="employees" element={<PayrollEmployeesListScreen />} />
      <Route path="attendance" element={<AttendanceMonitorScreen />} />
      <Route path="attendance/:locationId" element={<AttendanceLocationDetailScreen />} />
      <Route path="salaries" element={<ModulePlaceholderPage title="Salarios" />} />
      <Route path="*" element={<Navigate to="/payroll" replace />} />
    </Routes>
  );
}
