import {
  Combobox,
  DatePicker,
  EmpleadoActionButton,
  EmpleadoPage,
  EmpleadoPageHeader,
  EmpleadoPageSection,
  LoadingState,
  RecetaFilterSelect,
  RecetaTextInput,
  toast,
} from '@restopsiq/ui';
import { format, isValid, parseISO } from 'date-fns';
import { useMemo, useState } from 'react';

import { canWritePayrollNovedades } from '@/config/rbac.config';
import { useMe } from '@/features/auth/hooks/useMe';
import { useLocations } from '@/features/sedes/hooks/useLocations';
import { getRoleCodeFromToken } from '@/lib/auth-token';
import { useUiTheme } from '@/hooks/useUiTheme';
import { useTheme } from '@/providers/ThemeProvider';

import { usePayrollNovedadMutations } from '../hooks/usePayrollNovedadMutations';
import { usePayrollNovedadesQuery } from '../hooks/usePayrollNovedadesQuery';
import { useActivePayrollEmployeesQuery } from '../hooks/useActivePayrollEmployeesQuery';
import { PayrollNovedadFormModal } from '../components/PayrollNovedadFormModal';
import { PayrollNovedadesTable } from '../components/PayrollNovedadesTable';
import type {
  ListPayrollNovedadesFilters,
  NovedadType,
  PayrollNovedadSummary,
} from '../types/payroll-novedades.types';
import { NOVEDAD_TYPE_LABELS } from '../types/payroll-novedades.types';
import styles from './PayrollNovedadesScreen.module.scss';

type TabId = 'inbox' | 'history';

const TYPE_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  ...Object.entries(NOVEDAD_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

function isSupervisorRole(roleCode: string | null | undefined): boolean {
  return roleCode === 'SUPERVISOR' || roleCode === 'MANAGER';
}

function isRrhhRole(roleCode: string | null | undefined): boolean {
  return roleCode === 'NOMINA' || roleCode === 'OWNER' || roleCode === 'SUPER_ADMIN';
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
  keepEmptyOption = false,
): { value: string; label: string }[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return options;

  return options.filter(
    (option) =>
      (keepEmptyOption && option.value === '') || option.label.toLowerCase().includes(normalized),
  );
}

export function PayrollNovedadesScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const empleadoTheme = theme === 'light' ? 'light' : 'dark';
  const uiTheme = useUiTheme();
  const { data: me } = useMe();
  const roleCode = me?.roleCode ?? getRoleCodeFromToken();
  const canWrite = canWritePayrollNovedades(roleCode);
  const supervisor = isSupervisorRole(roleCode);
  const rrhh = isRrhhRole(roleCode);

  const [tab, setTab] = useState<TabId>('inbox');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [rejectTarget, setRejectTarget] = useState<PayrollNovedadSummary | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [filterEmployeeSearch, setFilterEmployeeSearch] = useState('');

  const listFilters = useMemo<ListPayrollNovedadesFilters>(
    () => ({
      locationId: selectedLocationId || undefined,
      employeeId: selectedEmployeeId || undefined,
      type: (selectedType || undefined) as NovedadType | undefined,
      startDateFrom: dateFrom || undefined,
      startDateTo: dateTo || undefined,
      supervisorInbox: tab === 'inbox' && supervisor ? true : undefined,
      rrhhInbox: tab === 'inbox' && rrhh && !supervisor ? true : undefined,
      take: 50,
    }),
    [selectedLocationId, selectedEmployeeId, selectedType, dateFrom, dateTo, tab, supervisor, rrhh],
  );

  const novedadesQuery = usePayrollNovedadesQuery(listFilters);
  const locationsQuery = useLocations();
  const employeesQuery = useActivePayrollEmployeesQuery();
  const {
    approveSupervisorMutation,
    rejectSupervisorMutation,
    approveRrhhMutation,
    rejectRrhhMutation,
  } = usePayrollNovedadMutations(listFilters);

  const novedades = novedadesQuery.data ?? [];

  const locationOptions = useMemo(
    () => [
      { value: '', label: 'Todas las sedes' },
      ...(locationsQuery.data?.map((location) => ({ value: location.id, label: location.name })) ??
        []),
    ],
    [locationsQuery.data],
  );

  const employeeOptions = useMemo(
    () => [
      { value: '', label: 'Todos los empleados' },
      ...(employeesQuery.data?.map((employee) => ({
        value: employee.id,
        label: employee.name,
      })) ?? []),
    ],
    [employeesQuery.data],
  );

  const filterEmployeeSelectOptions = useMemo(
    () => filterEmployeeOptions(employeeOptions, filterEmployeeSearch, true),
    [employeeOptions, filterEmployeeSearch],
  );

  const handleApprove = async (row: PayrollNovedadSummary) => {
    try {
      if (row.status === 'PENDIENTE_SUPERVISOR' && supervisor) {
        await approveSupervisorMutation.mutateAsync(row.id);
      } else if (row.status === 'PENDIENTE_RRHH' && rrhh) {
        await approveRrhhMutation.mutateAsync(row.id);
      }
      toast.success('Novedad aprobada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo aprobar');
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) {
      toast.error('El motivo de rechazo es obligatorio');
      return;
    }
    try {
      const input = { rejectionReason: rejectReason.trim() };
      if (rejectTarget.status === 'PENDIENTE_SUPERVISOR' && supervisor) {
        await rejectSupervisorMutation.mutateAsync({ id: rejectTarget.id, input });
      } else if (rejectTarget.status === 'PENDIENTE_RRHH' && rrhh) {
        await rejectRrhhMutation.mutateAsync({ id: rejectTarget.id, input });
      }
      toast.success('Novedad rechazada');
      setRejectTarget(null);
      setRejectReason('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo rechazar');
    }
  };

  if (novedadesQuery.isLoading) {
    return (
      <LoadingState
        message="Cargando novedades…"
        theme={empleadoTheme === 'dark' ? 'dark' : 'light'}
        layout="compact"
      />
    );
  }

  if (novedadesQuery.isError) {
    return (
      <div className={styles.state}>
        <p>No se pudieron cargar las novedades.</p>
        <EmpleadoActionButton label="Reintentar" onClick={() => novedadesQuery.refetch()} />
      </div>
    );
  }

  return (
    <EmpleadoPage theme={empleadoTheme} className={styles.payrollNovedadesScreen}>
      <EmpleadoPageSection theme={empleadoTheme} variant="header" divider>
        <EmpleadoPageHeader
          title="Novedades"
          subtitle="Bandeja de aprobación e histórico de ausencias, permisos y licencias"
          theme={empleadoTheme}
          size="md"
          primaryAction={
            canWrite ? (
              <EmpleadoActionButton
                theme={empleadoTheme}
                size="md"
                label="Nueva novedad"
                onClick={() => setCreateOpen(true)}
              />
            ) : undefined
          }
        />
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme} variant="toolbar" divider>
        <div className={styles.tabs}>
          <button
            type="button"
            className={tab === 'inbox' ? styles.tabButtonActive : styles.tabButton}
            onClick={() => setTab('inbox')}
          >
            Bandeja de aprobación
          </button>
          <button
            type="button"
            className={tab === 'history' ? styles.tabButtonActive : styles.tabButton}
            onClick={() => setTab('history')}
          >
            Listado histórico
          </button>
        </div>
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme}>
        <div className={styles.filtersBar}>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Sede</span>
            <RecetaFilterSelect
              value={selectedLocationId}
              options={locationOptions}
              onChange={setSelectedLocationId}
              theme={empleadoTheme}
              size="md"
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
            <span className={styles.filterLabel}>Tipo</span>
            <RecetaFilterSelect
              value={selectedType}
              options={TYPE_OPTIONS}
              onChange={setSelectedType}
              theme={empleadoTheme}
              size="md"
            />
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Desde</span>
            <DatePicker
              value={parseIsoDateValue(dateFrom)}
              onChange={(date) => setDateFrom(date ? toIsoDate(date) : '')}
              theme={empleadoTheme}
              size="md"
              className={styles.datePicker}
            />
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Hasta</span>
            <DatePicker
              value={parseIsoDateValue(dateTo)}
              onChange={(date) => setDateTo(date ? toIsoDate(date) : '')}
              theme={empleadoTheme}
              size="md"
              className={styles.datePicker}
            />
          </div>
        </div>

        {novedades.length === 0 ? (
          <div className={styles.state}>No hay novedades para mostrar.</div>
        ) : (
          <PayrollNovedadesTable
            novedades={novedades}
            theme={empleadoTheme}
            showInboxActions={tab === 'inbox'}
            supervisor={supervisor}
            rrhh={rrhh}
            onApprove={handleApprove}
            onReject={(row) => {
              setRejectTarget(row);
              setRejectReason('');
            }}
          />
        )}

        {rejectTarget && (
          <div className={styles.createForm}>
            <p className={styles.sectionTitle}>Rechazar novedad</p>
            <div className={styles.filterField}>
              <span className={styles.filterLabel}>Motivo (obligatorio)</span>
              <RecetaTextInput
                theme={uiTheme}
                className={styles.textInput}
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Indique el motivo del rechazo"
              />
            </div>
            <EmpleadoActionButton label="Confirmar rechazo" onClick={handleReject} />
            <EmpleadoActionButton
              label="Cancelar"
              onClick={() => {
                setRejectTarget(null);
                setRejectReason('');
              }}
            />
          </div>
        )}
      </EmpleadoPageSection>

      <PayrollNovedadFormModal
        open={createOpen}
        listFilters={listFilters}
        onClose={() => setCreateOpen(false)}
      />
    </EmpleadoPage>
  );
}
