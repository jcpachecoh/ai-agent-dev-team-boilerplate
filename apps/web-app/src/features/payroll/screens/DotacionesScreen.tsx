import {
  EmpleadoPage,
  EmpleadoPageHeader,
  EmpleadoPageSection,
  LoadingState,
  RecetaFilterSelect,
  toast,
} from '@restopsiq/ui';
import { Download, PackageCheck, RefreshCw, Users } from 'lucide-react';
import { useState } from 'react';

import { useTheme } from '@/providers/ThemeProvider';
import { useLocations } from '@/features/sedes/hooks/useLocations';
import { exportDotacionReport } from '../api/payroll.client';
import { downloadExportBlob } from '../utils/download-export-blob';
import {
  useGenerateEntitlementsMutation,
  useMarkNotApplicableMutation,
  useRegisterDotacionMutation,
} from '../hooks/useDotacionesMutations';
import { useDotacionPeriodQuery } from '../hooks/useDotacionesQuery';
import type { DotacionDelivery } from '../types/dotaciones.types';
import {
  DOTACION_STATUS_LABELS,
  buildDotacionPeriod,
  getCurrentDotacionPeriod,
} from '../types/dotaciones.types';
import { BulkAssignByPositionModal } from '../components/BulkAssignByPositionModal';
import { RegisterDotacionModal } from '../components/RegisterDotacionModal';
import styles from './DotacionesScreen.module.scss';

const CURRENT_YEAR = new Date().getFullYear();

const YEAR_OPTIONS = [
  { value: String(CURRENT_YEAR - 1), label: String(CURRENT_YEAR - 1) },
  { value: String(CURRENT_YEAR), label: String(CURRENT_YEAR) },
  { value: String(CURRENT_YEAR + 1), label: String(CURRENT_YEAR + 1) },
];

const PERIOD_MONTH_OPTIONS = [
  { value: '04', label: 'Abril (30-abr)' },
  { value: '08', label: 'Agosto (31-ago)' },
  { value: '12', label: 'Diciembre (20-dic)' },
];

export function DotacionesScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const empleadoTheme = theme === 'light' ? 'light' : 'dark';

  const defaultPeriod = getCurrentDotacionPeriod();
  const [selectedYear, setSelectedYear] = useState(defaultPeriod.split('-')[0]!);
  const [selectedMonth, setSelectedMonth] = useState<'04' | '08' | '12'>(
    defaultPeriod.split('-')[1] as '04' | '08' | '12',
  );
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [registerTarget, setRegisterTarget] = useState<DotacionDelivery | null>(null);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const period = buildDotacionPeriod(Number(selectedYear), selectedMonth);
  const locationId = selectedLocationId || undefined;

  const locationsQuery = useLocations();
  const periodQuery = useDotacionPeriodQuery(period, locationId);
  const generateMutation = useGenerateEntitlementsMutation();
  const registerMutation = useRegisterDotacionMutation(period, locationId);
  const markNaMutation = useMarkNotApplicableMutation(period, locationId);

  const deliveries = periodQuery.data?.edges ?? [];

  const summary = {
    total: deliveries.length,
    entregadas: deliveries.filter((d) => d.status === 'ENTREGADA').length,
    pendientes: deliveries.filter((d) => d.status === 'PENDIENTE').length,
    noAplica: deliveries.filter((d) => d.status === 'NO_APLICA').length,
  };

  const locationOptions = [
    { value: '', label: 'Todas las sedes' },
    ...(locationsQuery.data?.map((l) => ({ value: l.id, label: l.name })) ?? []),
  ];

  async function handleGenerate() {
    const confirmed = window.confirm(
      `¿Generar registros de dotación para el período ${period}?\n\nEsta acción creará registros para todos los empleados elegibles que no los tengan aún.`,
    );
    if (!confirmed) return;

    try {
      const result = await generateMutation.mutateAsync(period);
      toast.success(
        `Período ${period} procesado: ${result.created} nuevos registros, ${result.skipped} ya existían.`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al generar el período';
      toast.error(msg);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await exportDotacionReport(period, locationId);
      const sedeLabel =
        locationOptions.find((o) => o.value === selectedLocationId)?.label ?? 'todas';
      downloadExportBlob(blob, `reporte-dotacion-${period}-${sedeLabel}.csv`);
      toast.success('Reporte descargado');
    } catch {
      toast.error('No se pudo descargar el reporte');
    } finally {
      setExporting(false);
    }
  }

  async function handleMarkNotApplicable(delivery: DotacionDelivery) {
    const reason = window.prompt('Razón (opcional):') ?? undefined;
    try {
      await markNaMutation.mutateAsync({ id: delivery.id, reason });
      toast.success('Marcado como No Aplica');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar';
      toast.error(msg);
    }
  }

  return (
    <EmpleadoPage theme={empleadoTheme} className={styles.screen}>
      <EmpleadoPageSection theme={empleadoTheme} divider variant="header">
        <EmpleadoPageHeader
          title="Dotación"
          subtitle="Control de entrega de calzado y vestido de labor — Art. 230 CST"
          theme={empleadoTheme}
        />
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme}>
        {/* Filters */}
        <div className={styles.filtersBar}>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Año</span>
            <RecetaFilterSelect
              value={selectedYear}
              options={YEAR_OPTIONS}
              onChange={(v) => setSelectedYear(v)}
              theme={empleadoTheme}
            />
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Período</span>
            <RecetaFilterSelect
              value={selectedMonth}
              options={PERIOD_MONTH_OPTIONS}
              onChange={(v) => setSelectedMonth(v as '04' | '08' | '12')}
              theme={empleadoTheme}
            />
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Sede</span>
            <RecetaFilterSelect
              value={selectedLocationId}
              options={locationOptions}
              onChange={(v) => setSelectedLocationId(v)}
              theme={empleadoTheme}
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.summaryBar}>
            <span className={styles.summaryItem}>
              Total: <strong className={styles.summaryValue}>{summary.total}</strong>
            </span>
            <span className={styles.summaryItem}>
              ✓ Entregadas: <strong className={styles.summaryValue}>{summary.entregadas}</strong>
            </span>
            <span className={styles.summaryItem}>
              ⏳ Pendientes: <strong className={styles.summaryValue}>{summary.pendientes}</strong>
            </span>
            <span className={styles.summaryItem}>
              — N/A: <strong className={styles.summaryValue}>{summary.noAplica}</strong>
            </span>
          </div>
          <div className={styles.toolbarActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => void handleExport()}
              disabled={exporting || deliveries.length === 0}
            >
              <Download size={13} aria-hidden />
              {exporting ? 'Exportando…' : 'Exportar CSV'}
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setBulkAssignOpen(true)}
              disabled={deliveries.length === 0}
            >
              <Users size={13} aria-hidden />
              Asignar por cargo
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => void handleGenerate()}
              disabled={generateMutation.isPending}
            >
              <PackageCheck size={13} aria-hidden />
              {generateMutation.isPending ? 'Generando…' : 'Generar período'}
            </button>
          </div>
        </div>

        {/* Content */}
        {periodQuery.isLoading ? (
          <LoadingState />
        ) : periodQuery.isError ? (
          <div className={styles.state}>
            <p>No se pudo cargar el listado.</p>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => void periodQuery.refetch()}
            >
              <RefreshCw size={13} aria-hidden />
              Reintentar
            </button>
          </div>
        ) : deliveries.length === 0 ? (
          <div className={styles.state}>
            <p>
              No hay registros para el período <strong>{period}</strong>.
            </p>
            <p>Usa el botón "Generar período" para crear los registros de empleados elegibles.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Ítem entregado</th>
                <th>Cantidad</th>
                <th>Estado</th>
                <th>Fecha entrega</th>
                <th>Comprobante</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((delivery) => (
                <DotacionRow
                  key={delivery.id}
                  delivery={delivery}
                  onRegister={() => setRegisterTarget(delivery)}
                  onMarkNA={() => void handleMarkNotApplicable(delivery)}
                  markingNA={markNaMutation.isPending}
                />
              ))}
            </tbody>
          </table>
        )}

        {periodQuery.data?.pageInfo.hasNextPage ? (
          <div className={styles.loadMore}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => void periodQuery.refetch()}
            >
              Cargar más
            </button>
          </div>
        ) : null}
      </EmpleadoPageSection>

      {/* Register delivery modal */}
      {registerTarget ? (
        <RegisterDotacionModal
          delivery={registerTarget}
          period={period}
          locationId={locationId}
          onClose={() => setRegisterTarget(null)}
        />
      ) : null}

      {/* Bulk assign by position modal */}
      {bulkAssignOpen ? (
        <BulkAssignByPositionModal
          period={period}
          locationId={locationId}
          onClose={() => setBulkAssignOpen(false)}
        />
      ) : null}
    </EmpleadoPage>
  );
}

function DotacionRow({
  delivery,
  onRegister,
  onMarkNA,
  markingNA,
}: {
  delivery: DotacionDelivery;
  onRegister: () => void;
  onMarkNA: () => void;
  markingNA: boolean;
}): React.JSX.Element {
  const statusClass =
    delivery.status === 'ENTREGADA'
      ? styles.entregada
      : delivery.status === 'NO_APLICA'
        ? styles.noAplica
        : styles.pendiente;

  return (
    <tr>
      <td>{delivery.employeeName ?? delivery.employeeId}</td>
      <td>
        {delivery.supplyItem ? (
          <>
            <span className={styles.itemName}>{delivery.supplyItem.nombre}</span>
            {delivery.supplyItem.talla ? (
              <span className={styles.itemTalla}> · Talla {delivery.supplyItem.talla}</span>
            ) : null}
          </>
        ) : (
          <span style={{ color: 'var(--empleado-muted, #888)', fontSize: '0.75rem' }}>
            Sin asignar
          </span>
        )}
      </td>
      <td>{delivery.quantity}</td>
      <td>
        <span className={`${styles.statusBadge} ${statusClass}`}>
          {DOTACION_STATUS_LABELS[delivery.status]}
        </span>
      </td>
      <td>
        {delivery.deliveredAt
          ? new Date(delivery.deliveredAt).toLocaleDateString('es-CO', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : '—'}
      </td>
      <td>
        {delivery.signedReceiptUrl ? (
          <a
            className={styles.receiptLink}
            href={delivery.signedReceiptUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver comprobante
          </a>
        ) : (
          '—'
        )}
      </td>
      <td>
        <div className={styles.actionCell}>
          {delivery.status === 'PENDIENTE' ? (
            <>
              <button type="button" className={styles.btnPrimary} onClick={onRegister}>
                Registrar entrega
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={onMarkNA}
                disabled={markingNA}
              >
                N/A
              </button>
            </>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
