import {
  LoadingState,
  NominaKpiGrid,
  NominaLegalAlertsPanel,
  NominaPageHeader,
} from '@restopsiq/ui';
import { useMemo } from 'react';

import { useTheme } from '@/providers/ThemeProvider';
import { useAttendanceReportQuery } from '@/features/payroll/hooks/usePayrollReportQueries';
import {
  getCurrentPayrollPeriod,
  getMonthDateRange,
  mapLegalAlertItems,
} from '@/features/payroll/utils/mapPayrollReportToNomina';

import styles from './AttendanceReportsScreen.module.scss';

export function AttendanceReportsScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const nominaTheme = theme === 'light' ? 'light' : 'dark';
  const payrollPeriod = useMemo(() => getCurrentPayrollPeriod(), []);
  const monthRange = useMemo(() => getMonthDateRange(payrollPeriod), [payrollPeriod]);
  const attendanceQuery = useAttendanceReportQuery(monthRange);

  const kpiMetrics = useMemo(() => {
    const employees = attendanceQuery.data?.employees ?? [];
    const overtimeMinutes = employees.reduce((sum, employee) => sum + employee.overtimeMinutes, 0);
    const alerts = employees.filter((employee) => employee.exceededLegalOvertimeLimit).length;

    return [
      {
        id: 'employees',
        title: 'Colaboradores reportados',
        value: String(employees.length),
        description: `Periodo ${monthRange.from} – ${monthRange.to}`,
        tone: 'accent' as const,
      },
      {
        id: 'overtime',
        title: 'Horas extra acumuladas',
        value: `${Math.round(overtimeMinutes / 60)}h`,
        description: 'Total del mes en curso',
        tone: 'amber' as const,
      },
      {
        id: 'alerts',
        title: 'Alertas legales',
        value: String(alerts),
        description: 'Exceso de jornada detectado',
        tone: 'teal' as const,
      },
    ];
  }, [attendanceQuery.data, monthRange.from, monthRange.to]);

  const legalAlertItems = useMemo(
    () => mapLegalAlertItems(attendanceQuery.data),
    [attendanceQuery.data],
  );

  return (
    <section className={styles.page}>
      <NominaPageHeader
        theme={nominaTheme}
        title="Reportes"
        subtitle="Marcaciones, horas extra y cumplimiento legal del periodo"
      />

      <NominaKpiGrid theme={nominaTheme} metrics={kpiMetrics} className={styles.kpiGrid} />

      <NominaLegalAlertsPanel
        theme={nominaTheme}
        items={legalAlertItems}
        emptyTitle="Sin alertas legales"
        emptyDescription="No se detectaron excesos de jornada en el periodo consultado."
        className={styles.alerts}
      />

      <section className={styles.tableSection} aria-label="Detalle por colaborador">
        <h2 className={styles.tableTitle}>Detalle de asistencia</h2>
        {attendanceQuery.isLoading ? (
          <LoadingState
            message="Cargando reporte…"
            theme={nominaTheme === 'dark' ? 'dark' : 'light'}
            layout="inline"
          />
        ) : attendanceQuery.isError ? (
          <p className={styles.error} role="alert">
            No se pudo cargar el reporte de asistencia.
          </p>
        ) : (attendanceQuery.data?.employees.length ?? 0) === 0 ? (
          <p className={styles.muted}>No hay marcaciones en el periodo seleccionado.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Colaborador</th>
                  <th scope="col">Sede</th>
                  <th scope="col">Horas trabajadas</th>
                  <th scope="col">Horas extra</th>
                </tr>
              </thead>
              <tbody>
                {attendanceQuery.data?.employees.map((employee) => (
                  <tr key={employee.employeeId}>
                    <td>{employee.employeeName}</td>
                    <td>{employee.locationName}</td>
                    <td>{(employee.totalWorkedMinutes / 60).toFixed(1)} h</td>
                    <td>{(employee.overtimeMinutes / 60).toFixed(1)} h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
