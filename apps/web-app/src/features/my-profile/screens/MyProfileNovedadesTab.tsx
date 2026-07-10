import {
  EmpleadoActionButton,
  EmpleadoPageSection,
  EmpleadoSearch,
  LoadingState,
  RecetaFilterSelect,
} from '@restopsiq/ui';
import { useMemo, useState } from 'react';

import { PayrollFilterBar } from '@/features/payroll/components/PayrollFilterBar';
import {
  NOVEDAD_STATUS_LABELS,
  NOVEDAD_TYPE_LABELS,
  type NovedadStatus,
  type NovedadType,
} from '@/features/payroll/types/payroll-novedades.types';
import { useTheme } from '@/providers/ThemeProvider';

import { MyNovedadRequestModal } from '../components/MyNovedadRequestModal';
import { MyNovedadesTable } from '../components/MyNovedadesTable';
import { useMyPayrollNovedadesQuery } from '../hooks/useMyPayrollNovedadesQuery';
import styles from './MyProfileVacationsTab.module.scss';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  ...Object.entries(NOVEDAD_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'Todos los tipos' },
  ...Object.entries(NOVEDAD_TYPE_LABELS)
    .filter(([value]) => value !== 'AUSENCIA_INJUSTIFICADA')
    .map(([value, label]) => ({ value, label })),
];

interface Props {
  employeeId: string | undefined;
}

export function MyProfileNovedadesTab({ employeeId }: Props): React.JSX.Element {
  const { theme } = useTheme();
  const empleadoTheme = theme === 'light' ? 'light' : 'dark';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);

  const listFilters = useMemo(
    () => ({
      type: typeFilter === 'all' ? undefined : (typeFilter as NovedadType),
      take: 50,
    }),
    [typeFilter],
  );

  const novedadesQuery = useMyPayrollNovedadesQuery(listFilters, !!employeeId);
  const novedades = novedadesQuery.data ?? [];

  const filteredNovedades = useMemo(() => {
    const query = search.trim().toLowerCase();
    const byStatus =
      statusFilter === 'all'
        ? novedades
        : novedades.filter((item) => item.status === (statusFilter as NovedadStatus));

    if (!query) return byStatus;

    return byStatus.filter((item) => {
      const haystack = [
        NOVEDAD_TYPE_LABELS[item.type],
        NOVEDAD_STATUS_LABELS[item.status],
        item.startDate.slice(0, 10),
        item.endDate.slice(0, 10),
        item.notes ?? '',
        item.rejectionReason ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [novedades, search, statusFilter]);

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
        <p>No se pudieron cargar sus novedades.</p>
        <button type="button" onClick={() => void novedadesQuery.refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
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
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Tipo</span>
            <RecetaFilterSelect
              theme={empleadoTheme}
              size="md"
              value={typeFilter}
              onChange={setTypeFilter}
              options={TYPE_OPTIONS}
              placeholder="Tipo"
            />
          </div>
          <EmpleadoActionButton
            theme={empleadoTheme}
            label="Solicitar novedad"
            onClick={() => setModalOpen(true)}
          />
        </PayrollFilterBar>
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme}>
        {filteredNovedades.length === 0 ? (
          <div className={styles.state}>
            {novedades.length === 0
              ? 'No tiene novedades registradas.'
              : 'No hay solicitudes para los filtros seleccionados.'}
          </div>
        ) : (
          <MyNovedadesTable novedades={filteredNovedades} theme={empleadoTheme} />
        )}
      </EmpleadoPageSection>

      <MyNovedadRequestModal
        open={modalOpen}
        employeeId={employeeId}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
