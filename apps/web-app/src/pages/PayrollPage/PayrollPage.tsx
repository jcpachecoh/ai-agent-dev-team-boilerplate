import { Navigate, Route, Routes } from 'react-router-dom';

import {
  CesantiasScreen,
  EmployeeCatalogAdminScreen,
  EmployeePositionsListScreen,
  MedicalLeavesScreen,
  PayrollEmployeeProfileScreen,
  PayrollEmployeesListScreen,
  PayrollLegalParametersScreen,
  PayrollNovedadesScreen,
  PayrollReportsScreen,
  RotanteAssignmentsScreen,
  VacationApprovalsScreen,
} from '@/features/payroll';
import { RedirectLegacyPayrollAttendance } from '@/pages/AttendancePage/AttendancePage';

export default function PayrollPage(): React.JSX.Element {
  return (
    <Routes>
      <Route index element={<PayrollReportsScreen />} />
      <Route path="reports" element={<PayrollReportsScreen />} />
      <Route path="employees" element={<PayrollEmployeesListScreen />} />
      <Route path="employees/:userId/profile" element={<PayrollEmployeeProfileScreen />} />
      <Route path="positions" element={<EmployeePositionsListScreen />} />
      <Route path="catalogs" element={<EmployeeCatalogAdminScreen />} />
      <Route path="attendance/*" element={<RedirectLegacyPayrollAttendance />} />
      <Route path="legal-parameters" element={<PayrollLegalParametersScreen />} />
      <Route path="novedades" element={<PayrollNovedadesScreen />} />
      <Route path="novedades/incapacidades" element={<MedicalLeavesScreen />} />
      <Route path="vacations" element={<VacationApprovalsScreen />} />
      <Route path="cesantias" element={<CesantiasScreen />} />
      <Route path="rotante-assignments" element={<RotanteAssignmentsScreen />} />
      <Route path="*" element={<Navigate to="/payroll" replace />} />
    </Routes>
  );
}
