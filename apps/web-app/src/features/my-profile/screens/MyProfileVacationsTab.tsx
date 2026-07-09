import {
  EmpleadoActionButton,
  EmpleadoPageSection,
  EmpleadoSearch,
  LoadingState,
  RecetaFilterSelect,
  RecetaMetricCard,
} from '@restopsiq/ui';
import { useMemo, useState } from 'react';

import { PayrollFilterBar } from '@/features/payroll/components/PayrollFilterBar';
import {
  VACATION_STATUS_LABELS,
  VACATION_TYPE_LABELS,
  type VacationStatus,
} from '@/features/payroll/types/vacations.types';
import {
  formatVacationDate,
  canRequestVacations,
} from '@/features/payroll/utils/vacation-display.utils';
import type { EmployeeContractType } from '@/features/payroll/types/payroll.types';
import { useTheme } from '@/providers/ThemeProvider';

import { MyVacationRequestsTable } from '../components/MyVacationRequestsTable';
import { VacationRequestModal } from '../components/VacationRequestModal';
import { useMyVacationBalance } from '../hooks/useMyEmployee';
import { useMyVacationRequests } from '../hooks/useMyVacationRequests';
import styles from './MyProfileVacationsTab.module.scss';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'SOLICITADA', label: 'Solicitada' },
  { value: 'APROBADA_NIVEL_1', label: 'Aprobada nivel 1' },
  { value: 'APROBADA', label: 'Aprobada' },
  { value: 'RECHAZADA', label: 'Rechazada' },
];

interface Props {
  employeeId: string | undefined;
  contractType: EmployeeContractType | undefined;
}

export function MyProfileVacationsTab({ employeeId, contractType }: Props): React.JSX.Element {
  const { theme } = useTheme();
  const empleadoTheme = theme === 'light' ? 'light' : 'dark';
  const balanceQuery = useMyVacationBalance(employeeId);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const requestFilters = useMemo(
    () => ({
      status: statusFilter === 'all' ? undefined : (statusFilter as VacationStatus),
      take: 50,
    }),
    [statusFilter],
  );

  const requestsQuery = useMyVacationRequests(employeeId, requestFilters);
  const requests = requestsQuery.data ?? [];

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return requests;

    return requests.filter((request) => {
      const haystack = [
        formatVacationDate(request.startDate),
        formatVacationDate(request.endDate),
        VACATION_TYPE_LABELS[request.type],
        VACATION_STATUS_LABELS[request.status],
        String(request.daysRequested),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [requests, search]);

  if (balanceQuery.isLoading || requestsQuery.isLoading) {
    return (
      <LoadingState
        message="Cargando vacaciones…"
        theme={empleadoTheme === 'dark' ? 'dark' : 'light'}
        layout="compact"
      />
    );
  }

  if (balanceQuery.isError || requestsQuery.isError) {
    return (
      <div className={styles.state}>
        <p>No se pudieron cargar sus vacaciones.</p>
        <button type="button" onClick={() => void balanceQuery.refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  const balance = balanceQuery.data;
  const canRequest = canRequestVacations(contractType);

  return (
    <>
      {!canRequest ? (
        <EmpleadoPageSection theme={empleadoTheme} divider>
          <p className={styles.ineligibleNotice}>
            Los colaboradores con contrato por prestación de servicios no pueden solicitar
            vacaciones.
          </p>
        </EmpleadoPageSection>
      ) : null}
      <EmpleadoPageSection theme={empleadoTheme} divider>
        <div className={styles.metrics}>
          <RecetaMetricCard
            theme={empleadoTheme}
            size="sm"
            title="Días acumulados"
            value={balance?.accruedDays ?? 0}
            variant="type-2"
            showIcon={false}
          />
          <RecetaMetricCard
            theme={empleadoTheme}
            size="sm"
            title="Días disfrutados"
            value={balance?.takenDays ?? 0}
            variant="type-2"
            showIcon={false}
          />
          <RecetaMetricCard
            theme={empleadoTheme}
            size="sm"
            title="Días compensados"
            value={balance?.compensatedDays ?? 0}
            variant="type-3"
            showIcon={false}
          />
          <RecetaMetricCard
            theme={empleadoTheme}
            size="sm"
            title="Saldo disponible"
            value={balance?.availableDays ?? 0}
            variant="type-1"
            showIcon={false}
          />
        </div>
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme} divider variant="toolbar">
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
            <span className={styles.filterLabel}>Estado</span>
            <RecetaFilterSelect
              theme={empleadoTheme}
              size="md"
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
              placeholder="Estado"
            />
          </div>
          {canRequest ? (
            <EmpleadoActionButton
              theme={empleadoTheme}
              label="Solicitar vacaciones"
              onClick={() => setModalOpen(true)}
            />
          ) : null}
        </PayrollFilterBar>
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme}>
        {filteredRequests.length === 0 ? (
          <div className={styles.state}>
            {requests.length === 0
              ? 'No tiene solicitudes de vacaciones registradas.'
              : 'No hay solicitudes para los filtros seleccionados.'}
          </div>
        ) : (
          <MyVacationRequestsTable requests={filteredRequests} theme={empleadoTheme} />
        )}
      </EmpleadoPageSection>

      <VacationRequestModal
        open={modalOpen}
        employeeId={employeeId}
        availableDays={balance?.availableDays ?? 0}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
