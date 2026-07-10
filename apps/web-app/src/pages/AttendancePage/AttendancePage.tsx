import { Navigate, Route, Routes, useParams } from 'react-router-dom';

import {
  AsignacionTurnosScreen,
  AttendanceCardScreen,
  AttendanceCollaboratorsScreen,
  AttendanceDashboardScreen,
  AttendanceLocationDetailScreen,
  AttendanceMonitorScreen,
  TurnosListScreen,
  OvertimeInboxScreen,
} from '@/features/attendance';
import { ATTENDANCE_ROUTES } from '@/features/attendance/constants/routes';
import ModulePlaceholderPage from '@/pages/ModulePlaceholderPage';

const ATTENDANCE_COMING_SOON = 'Esta sección estará disponible próximamente.';

function RedirectLegacyPayrollAttendance(): React.JSX.Element {
  const params = useParams();
  const suffix = params['*'] ?? '';
  const target = suffix ? `${ATTENDANCE_ROUTES.monitor}/${suffix}` : ATTENDANCE_ROUTES.monitor;
  return <Navigate to={target} replace />;
}

export default function AttendancePage(): React.JSX.Element {
  return (
    <Routes>
      <Route index element={<AttendanceDashboardScreen />} />
      <Route path="colaboradores" element={<AttendanceCollaboratorsScreen />} />
      <Route path="turnos" element={<TurnosListScreen />} />
      <Route path="turnos/asignacion" element={<AsignacionTurnosScreen />} />
      <Route path="asistencias" element={<AttendanceMonitorScreen />} />
      <Route path="asistencias/:locationId" element={<AttendanceLocationDetailScreen />} />
      <Route
        path="asistencias/:locationId/employees/:userId/card"
        element={<AttendanceCardScreen />}
      />
      <Route path="tiempo-extra" element={<OvertimeInboxScreen />} />
      <Route
        path="reportes"
        element={<ModulePlaceholderPage title="Reportes" subtitle={ATTENDANCE_COMING_SOON} />}
      />
      <Route path="*" element={<Navigate to={ATTENDANCE_ROUTES.monitor} replace />} />
    </Routes>
  );
}

export { RedirectLegacyPayrollAttendance };
