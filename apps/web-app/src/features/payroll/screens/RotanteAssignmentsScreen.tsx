import {
  Combobox,
  DatePicker,
  EmpleadoActionButton,
  EmpleadoPage,
  EmpleadoPageHeader,
  EmpleadoPageSection,
  LoadingState,
  RecetaFilterSelect,
} from '@restopsiq/ui';
import { format, isValid, parseISO } from 'date-fns';
import { useMemo, useState } from 'react';

import { useLocations } from '@/features/sedes/hooks/useLocations';
import { useTheme } from '@/providers/ThemeProvider';

import { AssignRotanteSedeModal } from '../components/AssignRotanteSedeModal';
import { PayrollFilterBar } from '../components/PayrollFilterBar';
import { RotantePendingTable } from '../components/RotantePendingTable';
import { useActivePayrollEmployeesQuery } from '../hooks/useActivePayrollEmployeesQuery';
import { usePendingDailyCostCenterAssignmentsQuery } from '../hooks/useDailyCostCenterQuery';
import type { PendingAssignment } from '../types/daily-cost-center.types';
import styles from './RotanteAssignmentsScreen.module.scss';

function defaultRange(): { from: string; to: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function parseIsoDateValue(value: string): Date | undefined {
  if (!value) return undefined;
  const date = parseISO(value);
  return isValid(date) ? date : undefined;
}

function filterEmployeeOptions(
  options: { value: string; label: string }[],
  query: string,
): { value: string; label: string }[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return options;
  return options.filter(
    (option) => option.value === '' || option.label.toLowerCase().includes(normalized),
  );
}

export function RotanteAssignmentsScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const empleadoTheme = theme === 'light' ? 'light' : 'dark';

  const [range, setRange] = useState(defaultRange);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [filterEmployeeSearch, setFilterEmployeeSearch] = useState('');
  const [assigningRow, setAssigningRow] = useState<PendingAssignment | null>(null);

  const pendingQuery = usePendingDailyCostCenterAssignmentsQuery(range.from, range.to);
  const locationsQuery = useLocations();
  const employeesQuery = useActivePayrollEmployeesQuery();

  const locationNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const location of locationsQuery.data ?? []) {
      map.set(location.id, location.name);
    }
    return map;
  }, [locationsQuery.data]);

  const locationOptions = useMemo(
    () => [
      { value: '', label: 'Todas las sedes' },
      ...(locationsQuery.data ?? []).map((location) => ({
        value: location.id,
        label: location.name,
      })),
    ],
    [locationsQuery.data],
  );

  const employeeOptions = useMemo(() => {
    const rotantes = (employeesQuery.data ?? []).filter(
      (employee) => employee.costCenter === 'ROTANTE',
    );
    return [
      { value: '', label: 'Todos los empleados' },
      ...rotantes.map((employee) => ({
        value: employee.id,
        label: employee.name,
      })),
    ];
  }, [employeesQuery.data]);

  const filterEmployeeSelectOptions = useMemo(
    () => filterEmployeeOptions(employeeOptions, filterEmployeeSearch),
    [employeeOptions, filterEmployeeSearch],
  );

  const rows = useMemo(() => {
    let items = pendingQuery.data ?? [];
    if (selectedEmployeeId) {
      items = items.filter((item) => item.employeeId === selectedEmployeeId);
    }
    if (selectedLocationId) {
      items = items.filter((item) => item.suggestedLocationId === selectedLocationId);
    }
    return items;
  }, [pendingQuery.data, selectedEmployeeId, selectedLocationId]);

  return (
    <EmpleadoPage theme={empleadoTheme} scrollable className={styles.screen}>
      <EmpleadoPageSection theme={empleadoTheme} divider variant="header">
        <EmpleadoPageHeader
          title="Corrección de sede — Rotante"
          subtitle="Bandeja de días pendientes: turno programado sin sede asignada. Para corregir un día ya asignado, usa el tab Sede Rotante del perfil del empleado."
          theme={empleadoTheme}
        />
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme} variant="toolbar" divider>
        <PayrollFilterBar>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Sede sugerida</span>
            <RecetaFilterSelect
              value={selectedLocationId}
              options={locationOptions}
              onChange={setSelectedLocationId}
              theme={empleadoTheme}
              size="md"
              placeholder="Sede"
            />
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Empleado</span>
            <Combobox
              value={selectedEmployeeId}
              options={filterEmployeeSelectOptions}
              onChange={(value) => setSelectedEmployeeId(typeof value === 'string' ? value : '')}
              onSearch={setFilterEmployeeSearch}
              placeholder="Todos los empleados"
              theme={empleadoTheme}
              size="md"
              className={styles.combobox}
              loading={employeesQuery.isLoading}
            />
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Desde</span>
            <DatePicker
              value={parseIsoDateValue(range.from)}
              onChange={(date) =>
                setRange((prev) => ({ ...prev, from: date ? toIsoDate(date) : prev.from }))
              }
              theme={empleadoTheme}
              size="md"
              className={styles.datePicker}
            />
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Hasta</span>
            <DatePicker
              value={parseIsoDateValue(range.to)}
              onChange={(date) =>
                setRange((prev) => ({ ...prev, to: date ? toIsoDate(date) : prev.to }))
              }
              theme={empleadoTheme}
              size="md"
              className={styles.datePicker}
            />
          </div>
        </PayrollFilterBar>
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme}>
        {assigningRow ? (
          <AssignRotanteSedeModal
            open
            employeeId={assigningRow.employeeId}
            date={assigningRow.date}
            suggestedLocationId={assigningRow.suggestedLocationId}
            theme={empleadoTheme}
            onClose={() => setAssigningRow(null)}
          />
        ) : null}

        {pendingQuery.isLoading ? (
          <LoadingState
            message="Cargando pendientes…"
            theme={empleadoTheme === 'dark' ? 'dark' : 'light'}
            layout="compact"
          />
        ) : null}

        {pendingQuery.isError ? (
          <div className={styles.emptyState}>
            <p>No se pudo cargar la lista de pendientes.</p>
            <EmpleadoActionButton
              theme={empleadoTheme}
              size="md"
              label="Reintentar"
              onClick={() => void pendingQuery.refetch()}
            />
          </div>
        ) : null}

        {!pendingQuery.isLoading && !pendingQuery.isError && rows.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No hay días pendientes en este rango (con los filtros actuales).</p>
            <p className={styles.emptyHint}>
              Aquí solo aparecen huecos: turno sin sede. La asignación manual de un día concreto se
              hace en <strong>Empleados → perfil → Sede Rotante → Corregir</strong>. Prueba filtro{' '}
              <strong>Todas las sedes</strong> si tienes &quot;Sede sugerida&quot; acotada.
            </p>
          </div>
        ) : null}

        {rows.length > 0 ? (
          <RotantePendingTable
            rows={rows}
            theme={empleadoTheme}
            locationNameById={locationNameById}
            onAssign={setAssigningRow}
          />
        ) : null}
      </EmpleadoPageSection>
    </EmpleadoPage>
  );
}
