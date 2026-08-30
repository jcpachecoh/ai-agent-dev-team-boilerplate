import {
  LoadingState,
  NominaKpiGrid,
  NominaLegalAlertsPanel,
  NominaPageHeader,
  RecetaFilterSelect,
} from '@restopsiq/ui';
import { useMemo, useState } from 'react';

import { useTheme } from '@/providers/ThemeProvider';
import { useLocations } from '@/features/sedes/hooks/useLocations';
import { exportAttendanceReport } from '@/features/payroll/api/payroll.client';
import { PayrollExportMenu } from '@/features/payroll/components/PayrollExportMenu';
import { PayrollFilterBar } from '@/features/payroll/components/PayrollFilterBar';
import { usePayrollExport } from '@/features/payroll/hooks/usePayrollExport';
import { useAttendanceReportQuery } from '@/features/payroll/hooks/usePayrollReportQueries';
import type {
  AttendanceExportQuery,
  AttendanceReportStatusFilter,
} from '@/features/payroll/types/payroll-reports.types';
import {
  getCurrentPayrollPeriod,
  getMonthDateRange,
  mapLegalAlertItems,
} from '@/features/payroll/utils/mapPayrollReportToNomina';

import styles from './AttendanceReportsScreen.module.scss';

const STATUS_OPTIONS: Array<{ value: AttendanceReportStatusFilter; label: string }> = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PRESENT', label: 'Con marcaciones' },
  { value: 'ABSENT', label: 'Sin marcaciones' },
  { value: 'LATE', label: 'Alerta legal HE' },
];

export function AttendanceReportsScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const nominaTheme = theme === 'light' ? 'light' : 'dark';
  const payrollPeriod = useMemo(() => getCurrentPayrollPeriod(), []);
  const defaultRange = useMemo(() => getMonthDateRange(payrollPeriod), [payrollPeriod]);
  const [dateFrom, setDateFrom] = useState(defaultRange.from);
  const [dateTo, setDateTo] = useState(defaultRange.to);
  const [locationId, setLocationId] = useState('');
  const [status, setStatus] = useState<AttendanceReportStatusFilter>('ALL');
  const locationsQuery = useLocations();

  const attendanceQueryFilters = useMemo(
    () => ({
      from: dateFrom,
      to: dateTo,
      locationId: locationId || undefined,
      status: status === 'ALL' ? undefined : status,
    }),
    [dateFrom, dateTo, locationId, status],
  );

  const attendanceQuery = useAttendanceReportQuery(attendanceQueryFilters);
  const { loading: exportLoading, exportReport } = usePayrollExport<AttendanceExportQuery>({
    buildFilename: (format, filters) =>
      `asistencia-${filters.from}-${filters.to}.${format === 'PDF' ? 'pdf' : 'xlsx'}`,
    exportFn: (filters, format) => exportAttendanceReport(filters, format),
  });

  const locationOptions = useMemo(
    () =>
      (locationsQuery.data ?? [])
        .filter((location) => location.isActive !== false)
        .map((location) => ({ value: location.id, label: location.name })),
    [locationsQuery.data],
  );

  const kpiMetrics = useMemo(() => {
    const employees = attendanceQuery.data?.employees ?? [];
    const overtimeMinutes = employees.reduce((sum, employee) => sum + employee.overtimeMinutes, 0);
    const alerts = employees.filter((employee) => employee.exceededLegalOvertimeLimit).length;

    return [
      {
        id: 'employees',
        title: 'Colaboradores reportados',
        value: String(employees.length),
        description: `Periodo ${dateFrom} – ${dateTo}`,
        tone: 'accent' as const,
      },
      {
        id: 'overtime',
        title: 'Horas extra acumuladas',
        value: `${Math.round(overtimeMinutes / 60)}h`,
        description: 'Total del periodo',
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
  }, [attendanceQuery.data, dateFrom, dateTo]);

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

      <PayrollFilterBar>
        <div className={styles.filterField}>
          <span className={styles.filterLabel}>Desde</span>
          <input
            className={styles.filterInput}
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
        </div>
        <div className={styles.filterField}>
          <span className={styles.filterLabel}>Hasta</span>
          <input
            className={styles.filterInput}
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </div>
        <div className={styles.filterField}>
          <span className={styles.filterLabel}>Sede</span>
          <RecetaFilterSelect
            theme={nominaTheme}
            size="md"
            value={locationId}
            options={[{ value: '', label: 'Todas las sedes' }, ...locationOptions]}
            onChange={setLocationId}
          />
        </div>
        <div className={styles.filterField}>
          <span className={styles.filterLabel}>Estado</span>
          <RecetaFilterSelect
            theme={nominaTheme}
            size="md"
            value={status}
            options={STATUS_OPTIONS}
            onChange={(value) => setStatus(value as AttendanceReportStatusFilter)}
          />
        </div>
        <PayrollExportMenu
          theme={nominaTheme}
          loading={exportLoading}
          disabled={attendanceQuery.isLoading}
          onExport={(format) => void exportReport(attendanceQueryFilters, format)}
        />
      </PayrollFilterBar>

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
