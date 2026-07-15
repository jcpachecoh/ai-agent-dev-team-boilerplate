import {
  EmpleadoActionButton,
  EmpleadoPage,
  EmpleadoPageHeader,
  EmpleadoPageSection,
  LoadingState,
  RecetaFilterSelect,
  toast,
} from '@restopsiq/ui';
import { Download, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { canWriteCesantias } from '@/config/rbac.config';
import { useMe } from '@/features/auth/hooks/useMe';
import { getRoleCodeFromToken } from '@/lib/auth-token';
import { useTheme } from '@/providers/ThemeProvider';

import styles from './CesantiasScreen.module.scss';
import { PayrollFilterBar } from '../components/PayrollFilterBar';
import { PayrollApiError } from '../api/payroll.client';
import { CesantiasAlertBanner } from '../components/CesantiasAlertBanner';
import { CesantiasTable } from '../components/CesantiasTable';
import { useCesantiasExport } from '../hooks/useCesantiasExport';
import { useCesantiasMutations } from '../hooks/useCesantiasMutations';
import { useCesantiasExportAvailabilityQuery, useCesantiasQuery } from '../hooks/useCesantiasQuery';
import {
  buildCatalogSelectOptions,
  useEmployeeCatalogOptions,
} from '../hooks/useEmployeeCatalogOptions';
import type { CesantiasFundChannel, CesantiasSettlementStatus } from '../types/cesantias.types';
import {
  CESANTIAS_FUND_CHANNEL_FILTER_OPTIONS,
  CESANTIAS_STATUS_FILTER_OPTIONS,
  buildCesantiasYearOptions,
} from '../utils/cesantias-display';

const PAGE_SIZE = 50;

export function CesantiasScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const empleadoTheme = theme === 'light' ? 'light' : 'dark';
  const { data: me } = useMe();
  const roleCode = me?.roleCode ?? getRoleCodeFromToken();
  const canWrite = canWriteCesantias(roleCode);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedFund, setSelectedFund] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(0);

  const year = Number(selectedYear);

  const listFilters = useMemo(
    () => ({
      year,
      fundNameSnapshot: selectedFund || undefined,
      fundChannelSnapshot: (selectedChannel || undefined) as CesantiasFundChannel | undefined,
      cesantiasStatus: (selectedStatus || undefined) as CesantiasSettlementStatus | undefined,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    }),
    [year, selectedFund, selectedChannel, selectedStatus, page],
  );

  const listQuery = useCesantiasQuery(listFilters);
  // Sin filtros de canal/fondo/estado — determina si YA existe alguna liquidación para el
  // año seleccionado, para la confirmación antes de recalcular.
  const yearExistsQuery = useCesantiasQuery({ year, limit: 1 });
  // Disponibilidad de exportación por canal — viene ya resuelta por el backend
  // (GET /cesantias/export-availability, misma regla que usa CesantiasExportService para
  // armar los archivos: EXPORTABLE_CESANTIAS_STATUSES, nunca ANULADA). El frontend no
  // decide qué estados cuentan como exportables, solo consume el resultado.
  const exportAvailabilityQuery = useCesantiasExportAvailabilityQuery(year);

  const fundOptionsQuery = useEmployeeCatalogOptions('CESANTIAS_FUND');
  const fundFilterOptions = useMemo(
    () => [
      { value: '', label: 'Todos los fondos' },
      ...buildCatalogSelectOptions(fundOptionsQuery.data ?? [], selectedFund),
    ],
    [fundOptionsQuery.data, selectedFund],
  );

  const { calculateMutation } = useCesantiasMutations();
  const { loadingChannel, exportChannel } = useCesantiasExport();

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const totals = useMemo(
    () =>
      items.reduce(
        (acc, item) => ({
          cesantias: acc.cesantias + Number(item.cesantiasAmount),
          interest: acc.interest + Number(item.interestAmount),
        }),
        { cesantias: 0, interest: 0 },
      ),
    [items],
  );

  const hasExistingForYear = (yearExistsQuery.data?.total ?? 0) > 0;
  const hasFnaRecords = exportAvailabilityQuery.data?.fna ?? false;
  const hasPrivateRecords = exportAvailabilityQuery.data?.privateOperator ?? false;

  function resetFiltersToFirstPage() {
    setPage(0);
  }

  async function handleCalculate() {
    if (hasExistingForYear) {
      const confirmed = window.confirm(
        `Ya existen liquidaciones calculadas para ${year}. ¿Recalcular de todas formas?\n\nLas liquidaciones ya consignadas o pagadas no se modifican; el resto se vuelve a calcular con los datos actuales.`,
      );
      if (!confirmed) {
        return;
      }
    }
    try {
      const result = await calculateMutation.mutateAsync(year);
      toast.success(
        `Cálculo de ${year} completado: ${result.created} nuevas, ${result.updated} actualizadas, ${result.skipped.length} omitidas.`,
      );
    } catch (error) {
      const message =
        error instanceof PayrollApiError ? error.message : 'No se pudo calcular la liquidación';
      toast.error(message);
    }
  }

  return (
    <EmpleadoPage theme={empleadoTheme} className={styles.screen}>
      <EmpleadoPageSection theme={empleadoTheme} divider variant="header">
        <EmpleadoPageHeader
          title="Liquidación de cesantías"
          subtitle="Cálculo anual, consulta y exportación de archivos de consignación (FNA / fondos privados)"
          theme={empleadoTheme}
          size="md"
          primaryAction={
            canWrite ? (
              <EmpleadoActionButton
                theme={empleadoTheme}
                size="md"
                label={calculateMutation.isPending ? 'Calculando…' : 'Ejecutar cálculo anual'}
                icon={<RefreshCw size={14} aria-hidden />}
                disabled={calculateMutation.isPending}
                onClick={() => void handleCalculate()}
              />
            ) : undefined
          }
        />
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme} variant="toolbar" divider>
        <CesantiasAlertBanner className={styles.banner} />
        <PayrollFilterBar>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Año</span>
            <RecetaFilterSelect
              value={selectedYear}
              options={buildCesantiasYearOptions(currentYear)}
              onChange={(value) => {
                setSelectedYear(value);
                resetFiltersToFirstPage();
              }}
              theme={empleadoTheme}
              size="md"
            />
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Fondo</span>
            <RecetaFilterSelect
              value={selectedFund}
              options={fundFilterOptions}
              onChange={(value) => {
                setSelectedFund(value);
                resetFiltersToFirstPage();
              }}
              theme={empleadoTheme}
              size="md"
            />
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Canal</span>
            <RecetaFilterSelect
              value={selectedChannel}
              options={CESANTIAS_FUND_CHANNEL_FILTER_OPTIONS}
              onChange={(value) => {
                setSelectedChannel(value);
                resetFiltersToFirstPage();
              }}
              theme={empleadoTheme}
              size="md"
            />
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Estado</span>
            <RecetaFilterSelect
              value={selectedStatus}
              options={CESANTIAS_STATUS_FILTER_OPTIONS}
              onChange={(value) => {
                setSelectedStatus(value);
                resetFiltersToFirstPage();
              }}
              theme={empleadoTheme}
              size="md"
            />
          </div>
        </PayrollFilterBar>
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme}>
        <div className={styles.toolbar}>
          <span className={styles.count}>
            {total} {total === 1 ? 'liquidación' : 'liquidaciones'}
          </span>
          {canWrite ? (
            <div className={styles.exportActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                disabled={!hasFnaRecords || loadingChannel !== null}
                onClick={() => void exportChannel('fna', year)}
              >
                <Download size={13} aria-hidden />
                {loadingChannel === 'fna' ? 'Descargando…' : 'Descargar FNA'}
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                disabled={!hasPrivateRecords || loadingChannel !== null}
                onClick={() => void exportChannel('private-funds', year)}
              >
                <Download size={13} aria-hidden />
                {loadingChannel === 'private-funds' ? 'Descargando…' : 'Descargar fondos privados'}
              </button>
            </div>
          ) : null}
        </div>

        {listQuery.isLoading ? (
          <LoadingState
            message="Cargando liquidaciones…"
            theme={empleadoTheme === 'dark' ? 'dark' : 'light'}
            layout="compact"
          />
        ) : listQuery.isError ? (
          <div className={styles.state}>
            <p>No se pudo cargar el listado de liquidaciones.</p>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => void listQuery.refetch()}
            >
              <RefreshCw size={13} aria-hidden />
              Reintentar
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className={styles.state}>
            <p>No hay liquidaciones de cesantías para los filtros seleccionados.</p>
          </div>
        ) : (
          <CesantiasTable items={items} totals={totals} theme={empleadoTheme} />
        )}
      </EmpleadoPageSection>
    </EmpleadoPage>
  );
}
