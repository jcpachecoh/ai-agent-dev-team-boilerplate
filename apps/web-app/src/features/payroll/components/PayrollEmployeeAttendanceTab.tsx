import { RecetaFilterSelect, RecetaFormButton } from '@restopsiq/ui';
import { useMemo, useState } from 'react';

import { getErrorMessage } from '@/lib/graphql-client';

import { exportAttendanceReport } from '../api/payroll.client';
import type { AttendanceExportQuery } from '../types/payroll-reports.types';
import { PayrollExportMenu } from './PayrollExportMenu';
import { usePayrollExport } from '../hooks/usePayrollExport';
import { useEmployeeMarcacionesQuery } from '../hooks/useEmployeeMarcacionesQuery';
import { usePayrollEmployeeQuery } from '../hooks/usePayrollEmployeeQuery';
import type { MobileAttendanceStatus } from '../types/mobile-attendance.types';
import {
  formatDistanceMeters,
  formatMarcacionDate,
  formatMarcacionDateTime,
  formatMobileAttendanceEventType,
  formatMobileAttendanceStatus,
  formatRejectionReason,
  getDefaultMarcacionesDateRange,
} from '../utils/mobile-attendance-display';
import { PayrollEmployeeProfileTabLoading } from './PayrollEmployeeProfileTabLoading';
import styles from './PayrollEmployeeAttendanceTab.module.scss';

const STATUS_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Todos los estados' },
  { value: 'VALID', label: 'Válidas' },
  { value: 'REJECTED', label: 'Rechazadas' },
  { value: 'PENDING', label: 'Pendientes' },
];

interface PayrollEmployeeAttendanceTabProps {
  userId: string;
  theme: 'light' | 'dark';
}

export function PayrollEmployeeAttendanceTab({
  userId,
  theme,
}: PayrollEmployeeAttendanceTabProps): React.JSX.Element {
  const defaultRange = useMemo(() => getDefaultMarcacionesDateRange(), []);
  const [dateFrom, setDateFrom] = useState(defaultRange.dateFrom);
  const [dateTo, setDateTo] = useState(defaultRange.dateTo);
  const [statusFilter, setStatusFilter] = useState<MobileAttendanceStatus | ''>('');

  const employeeQuery = usePayrollEmployeeQuery(userId);
  const marcacionesQuery = useEmployeeMarcacionesQuery(employeeQuery.data?.id, {
    dateFrom,
    dateTo,
    status: statusFilter || null,
  });

  const exportFilters = useMemo(
    () => ({
      from: dateFrom,
      to: dateTo,
      employeeId: employeeQuery.data?.id,
    }),
    [dateFrom, dateTo, employeeQuery.data?.id],
  );

  const { loading: exportLoading, exportReport } = usePayrollExport<AttendanceExportQuery>({
    buildFilename: (format, filters) =>
      `asistencia-${employeeQuery.data?.name ?? userId}-${filters.from}-${filters.to}.${format === 'PDF' ? 'pdf' : 'xlsx'}`,
    exportFn: (filters, format) => exportAttendanceReport(filters, format),
  });

  const rows = useMemo(
    () => marcacionesQuery.data?.pages.flatMap((page) => page.edges.map((edge) => edge.node)) ?? [],
    [marcacionesQuery.data],
  );

  if (employeeQuery.isLoading) {
    return <PayrollEmployeeProfileTabLoading />;
  }

  if (employeeQuery.isError || !employeeQuery.data) {
    return (
      <div className={styles.state}>
        <p>No se pudo cargar el colaborador.</p>
        <button type="button" onClick={() => void employeeQuery.refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Historial de asistencia</h2>
          <p className={styles.subtitle}>
            Marcaciones móviles de entrada y salida registradas en el periodo seleccionado.
          </p>
        </div>
        <PayrollExportMenu
          theme={theme}
          loading={exportLoading}
          disabled={!employeeQuery.data}
          onExport={(format) => void exportReport(exportFilters, format)}
        />
      </div>

      <div className={styles.filters}>
        <label className={styles.field}>
          <span className={styles.label}>Desde</span>
          <input
            className={styles.input}
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Hasta</span>
          <input
            className={styles.input}
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </label>
        <div className={styles.field}>
          <span className={styles.label}>Estado</span>
          <RecetaFilterSelect
            aria-label="Filtrar por estado"
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as MobileAttendanceStatus | '')}
            theme={theme}
            size="md"
          />
        </div>
      </div>

      {marcacionesQuery.isLoading ? <PayrollEmployeeProfileTabLoading /> : null}

      {marcacionesQuery.isError ? (
        <div className={styles.state}>
          <p>{getErrorMessage(marcacionesQuery.error)}</p>
          <p className={styles.hint}>
            Requiere permiso <code>attendance.mobile.read</code> y rol de nómina autorizado.
          </p>
          <button type="button" onClick={() => void marcacionesQuery.refetch()}>
            Reintentar
          </button>
        </div>
      ) : null}

      {!marcacionesQuery.isLoading && !marcacionesQuery.isError && rows.length === 0 ? (
        <p className={styles.state}>No hay marcaciones en el periodo seleccionado.</p>
      ) : null}

      {!marcacionesQuery.isLoading && !marcacionesQuery.isError && rows.length > 0 ? (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha laboral</th>
                  <th>Registro</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Distancia</th>
                  <th>Motivo rechazo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{formatMarcacionDate(row.workDate)}</td>
                    <td>{formatMarcacionDateTime(row.timestamp)}</td>
                    <td>{formatMobileAttendanceEventType(row.eventType)}</td>
                    <td>
                      <span className={`${styles.statusPill} ${styles[`status--${row.status}`]}`}>
                        {formatMobileAttendanceStatus(row.status)}
                      </span>
                    </td>
                    <td>{formatDistanceMeters(row.distanceMeters)}</td>
                    <td>{formatRejectionReason(row.rejectionReason)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {marcacionesQuery.hasNextPage ? (
            <div className={styles.loadMore}>
              <RecetaFormButton
                type="button"
                theme={theme}
                variant="add"
                label={marcacionesQuery.isFetchingNextPage ? 'Cargando…' : 'Cargar más'}
                disabled={marcacionesQuery.isFetchingNextPage}
                onClick={() => void marcacionesQuery.fetchNextPage()}
              />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
