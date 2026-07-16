import {
  EmpleadoPage,
  EmpleadoPageHeader,
  EmpleadoPageSection,
  EmpleadoSearch,
  LoadingState,
  RecetaFilterSelect,
  RecetaMetricCard,
  RecetaTextInput,
} from '@restopsiq/ui';
import { useMemo, useState } from 'react';

import { useAttendanceScopeLocations } from '@/features/attendance/hooks/useAttendanceScopeLocations';
import { useMe } from '@/features/auth/hooks/useMe';
import { getRoleCodeFromToken } from '@/lib/auth-token';
import { useUiTheme } from '@/hooks/useUiTheme';
import { useTheme } from '@/providers/ThemeProvider';

import { PayrollFilterBar } from '../components/PayrollFilterBar';
import { VacationApprovalTable } from '../components/VacationApprovalTable';
import { VacationLocationCalendar } from '../components/VacationLocationCalendar';
import { VacationRejectModal } from '../components/VacationRejectModal';
import { useVacationApprovals } from '../hooks/useVacationApprovals';
import {
  VACATION_STATUS_LABELS,
  VACATION_TYPE_LABELS,
  type VacationStatus,
} from '../types/vacations.types';
import { formatVacationDate } from '../utils/vacation-display.utils';
import styles from './VacationApprovalsScreen.module.scss';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'SOLICITADA', label: 'Solicitada' },
  { value: 'APROBADA_NIVEL_1', label: 'Aprobada nivel 1' },
  { value: 'APROBADA', label: 'Aprobada' },
  { value: 'RECHAZADA', label: 'Rechazada' },
];

export function VacationApprovalsScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const empleadoTheme = theme === 'light' ? 'light' : 'dark';
  const uiTheme = useUiTheme();
  const { data: me } = useMe();
  const roleCode = me?.roleCode ?? getRoleCodeFromToken();
  const { locations, isLoading: locationsLoading } = useAttendanceScopeLocations();
  const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const defaultLocationId = locations[0]?.id ?? '';
  const { filters, setFilters, query, requests } = useVacationApprovals({
    locationId: defaultLocationId,
  });

  const locationOptions = useMemo(
    () => [
      { value: '', label: 'Todas las sedes' },
      ...locations.map((location) => ({ value: location.id, label: location.name })),
    ],
    [locations],
  );

  const filteredRequests = useMemo(() => {
    const queryText = search.trim().toLowerCase();
    if (!queryText) return requests;

    return requests.filter((request) => {
      const haystack = [
        request.employeeName,
        request.locationName ?? '',
        formatVacationDate(request.startDate),
        formatVacationDate(request.endDate),
        VACATION_TYPE_LABELS[request.type],
        VACATION_STATUS_LABELS[request.status],
        String(request.daysRequested),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(queryText);
    });
  }, [requests, search]);

  const pendingCount = requests.filter((request) => request.status === 'SOLICITADA').length;
  const approvedCount = requests.filter((request) => request.status === 'APROBADA').length;

  if (locationsLoading || query.isLoading) {
    return (
      <LoadingState
        message="Cargando solicitudes de vacaciones…"
        theme={empleadoTheme === 'dark' ? 'dark' : 'light'}
        layout="compact"
      />
    );
  }

  if (query.isError) {
    return (
      <div className={styles.state}>
        <p>No se pudieron cargar las solicitudes.</p>
        <button type="button" onClick={() => void query.refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <EmpleadoPage theme={empleadoTheme} className={styles.page}>
      <EmpleadoPageSection theme={empleadoTheme} variant="header" divider>
        <EmpleadoPageHeader
          title="Vacaciones"
          subtitle="Bandeja de aprobación Supervisor → RRHH"
          theme={empleadoTheme}
        />
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme} divider>
        <div className={styles.metrics}>
          <RecetaMetricCard
            theme={empleadoTheme}
            size="sm"
            title="Total"
            value={requests.length}
            variant="type-2"
            showIcon={false}
          />
          <RecetaMetricCard
            theme={empleadoTheme}
            size="sm"
            title="Pendientes"
            value={pendingCount}
            variant="type-3"
            showIcon={false}
          />
          <RecetaMetricCard
            theme={empleadoTheme}
            size="sm"
            title="Aprobadas"
            value={approvedCount}
            variant="type-1"
            showIcon={false}
          />
          <RecetaMetricCard
            theme={empleadoTheme}
            size="sm"
            title="Filtradas"
            value={filteredRequests.length}
            variant="type-2"
            showIcon={false}
          />
        </div>
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme} variant="toolbar" divider>
        <div className={styles.searchRow}>
          <EmpleadoSearch
            value={search}
            placeholder="Buscar solicitudes"
            onValueChange={setSearch}
            theme={empleadoTheme}
          />
        </div>
        <PayrollFilterBar>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Sede</span>
            <RecetaFilterSelect
              size="md"
              theme={empleadoTheme}
              value={filters.locationId}
              onChange={(value) => setFilters((prev) => ({ ...prev, locationId: value }))}
              options={locationOptions}
              placeholder="Sede"
            />
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Estado</span>
            <RecetaFilterSelect
              size="md"
              theme={empleadoTheme}
              value={filters.status}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  status: value as VacationStatus | 'all',
                }))
              }
              options={STATUS_OPTIONS}
              placeholder="Estado"
            />
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Mes</span>
            <RecetaTextInput
              type="month"
              theme={uiTheme}
              className={styles.dateInput}
              value={filters.month}
              onChange={(event) => setFilters((prev) => ({ ...prev, month: event.target.value }))}
            />
          </div>
        </PayrollFilterBar>
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme} divider className={styles.calendarSection}>
        {filters.month ? (
          <VacationLocationCalendar
            month={filters.month}
            locationId={filters.locationId}
            requests={requests}
          />
        ) : null}
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme} className={styles.tableSection}>
        {filteredRequests.length === 0 ? (
          <div className={styles.state}>
            {requests.length === 0
              ? 'No hay solicitudes para los filtros seleccionados.'
              : 'No hay solicitudes que coincidan con la búsqueda.'}
          </div>
        ) : (
          <VacationApprovalTable
            requests={filteredRequests}
            roleCode={roleCode}
            theme={empleadoTheme}
            onReject={setRejectRequestId}
          />
        )}
      </EmpleadoPageSection>

      <VacationRejectModal
        open={rejectRequestId !== null}
        requestId={rejectRequestId}
        onClose={() => setRejectRequestId(null)}
      />
    </EmpleadoPage>
  );
}
