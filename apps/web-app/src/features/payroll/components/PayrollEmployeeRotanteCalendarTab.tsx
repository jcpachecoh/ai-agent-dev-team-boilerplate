import { useMemo, useState } from 'react';

import { canWritePayrollEmployee } from '@/config/rbac.config';
import { useMe } from '@/features/auth/hooks/useMe';
import { getRoleCodeFromToken } from '@/lib/auth-token';

import { AssignRotanteSedeModal } from './AssignRotanteSedeModal';
import { PayrollEmployeeProfileTabLoading } from './PayrollEmployeeProfileTabLoading';
import { useEmployeeDailyCostCenterCalendarQuery } from '../hooks/useDailyCostCenterQuery';
import { usePayrollEmployeeQuery } from '../hooks/usePayrollEmployeeQuery';
import type { EmployeeCalendarDay } from '../types/daily-cost-center.types';
import styles from './PayrollEmployeeRotanteCalendarTab.module.scss';

interface Props {
  userId: string;
  theme: 'light' | 'dark';
}

function currentMonthRange(offset: number): { from: string; to: string; label: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
    label: start.toLocaleDateString('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
  };
}

function formatDayLabel(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('es-CO', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  });
}

function sourceLabel(source: EmployeeCalendarDay['source']): string {
  if (source === 'TURNO_ASIGNADO') return 'Turno';
  if (source === 'MARCACION_ASISTENCIA') return 'Marcación';
  if (source === 'MANUAL') return 'Manual';
  return 'Pendiente';
}

function sourceClass(day: EmployeeCalendarDay): string {
  if (day.isPending) return styles.pending;
  if (day.source === 'TURNO_ASIGNADO') return styles.turno;
  if (day.source === 'MARCACION_ASISTENCIA') return styles.marcacion;
  return styles.manual;
}

export function PayrollEmployeeRotanteCalendarTab({ userId, theme }: Props): React.JSX.Element {
  const { data: me } = useMe();
  const roleCode = me?.roleCode ?? getRoleCodeFromToken();
  const canWrite = canWritePayrollEmployee(roleCode);

  const [monthOffset, setMonthOffset] = useState(0);
  const [editingDay, setEditingDay] = useState<EmployeeCalendarDay | null>(null);

  const { from, to, label } = useMemo(() => currentMonthRange(monthOffset), [monthOffset]);

  const employeeQuery = usePayrollEmployeeQuery(userId);
  const employeeId = employeeQuery.data?.id;
  const isRotante = employeeQuery.data?.costCenter === 'ROTANTE';

  const calendarQuery = useEmployeeDailyCostCenterCalendarQuery(employeeId, from, to, isRotante);

  if (employeeQuery.isLoading) {
    return <PayrollEmployeeProfileTabLoading />;
  }

  if (!isRotante) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyState}>
          Este colaborador no tiene Centro de Costos Rotante — no aplica sede diaria.
        </p>
      </div>
    );
  }

  const days = calendarQuery.data ?? [];

  return (
    <div className={styles.container}>
      {editingDay && employeeId ? (
        <AssignRotanteSedeModal
          open
          employeeId={employeeId}
          date={editingDay.date}
          suggestedLocationId={editingDay.locationId}
          theme={theme}
          onClose={() => setEditingDay(null)}
        />
      ) : null}

      <div className={styles.header}>
        <span className={styles.title}>Sede diaria — Rotante</span>
        <div className={styles.monthNav}>
          <button type="button" onClick={() => setMonthOffset((value) => value - 1)}>
            ←
          </button>
          <span className={styles.monthLabel}>{label}</span>
          <button type="button" onClick={() => setMonthOffset((value) => value + 1)}>
            →
          </button>
        </div>
      </div>

      <div className={styles.legend}>
        <span className={`${styles.legendItem} ${styles.turno}`}>Turno</span>
        <span className={`${styles.legendItem} ${styles.marcacion}`}>Marcación</span>
        <span className={`${styles.legendItem} ${styles.manual}`}>Manual</span>
        <span className={`${styles.legendItem} ${styles.pending}`}>Pendiente</span>
      </div>

      {calendarQuery.isLoading ? <PayrollEmployeeProfileTabLoading /> : null}

      {calendarQuery.isError ? (
        <div className={styles.emptyState}>
          <p>No se pudo cargar el calendario.</p>
          <button type="button" onClick={() => void calendarQuery.refetch()}>
            Reintentar
          </button>
        </div>
      ) : null}

      {!calendarQuery.isLoading && !calendarQuery.isError && days.length === 0 ? (
        <p className={styles.emptyState}>Sin asignaciones ni pendientes en este mes.</p>
      ) : null}

      <div className={styles.list}>
        {days.map((day) => (
          <div key={day.date} className={`${styles.row} ${sourceClass(day)}`}>
            <span className={styles.date}>{formatDayLabel(day.date)}</span>
            <span className={styles.locationName}>{day.locationName ?? 'Sin asignar'}</span>
            <span className={styles.sourceBadge}>{sourceLabel(day.source)}</span>
            {canWrite ? (
              <button
                type="button"
                className={styles.editButton}
                onClick={() => setEditingDay(day)}
              >
                {day.isPending ? 'Asignar' : 'Corregir'}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
