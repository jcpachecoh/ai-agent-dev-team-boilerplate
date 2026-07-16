import { LoadingState, toast } from '@restopsiq/ui';
import { useMemo, useState } from 'react';

import { canWritePayrollEmployee } from '@/config/rbac.config';
import { useMe } from '@/features/auth/hooks/useMe';
import { getRoleCodeFromToken } from '@/lib/auth-token';
import { useTheme } from '@/providers/ThemeProvider';

import { PilaDeadlineAlertBanner } from './PilaDeadlineAlertBanner';
import { PilaExportHistory } from './PilaExportHistory';
import { PilaMarkPaidModal } from './PilaMarkPaidModal';
import styles from './PilaPeriodPanel.module.scss';
import { PilaPeriodStatusCard } from './PilaPeriodStatusCard';
import { PilaValidationErrors } from './PilaValidationErrors';
import { PilaVoidModal } from './PilaVoidModal';
import { PayrollApiError } from '../api/payroll.client';
import {
  useDownloadPilaAnexo2ReviewMutation,
  useDownloadPilaMutation,
  useGeneratePilaMutation,
  useMarkPilaPaidMutation,
  usePilaExportsQuery,
  usePilaValidationQuery,
  useVoidPilaMutation,
} from '../hooks/usePilaExportQueries';
import type { PilaExportFormat, PilaPeriodExport } from '../types/pila.types';
import { downloadExportBlob } from '../utils/download-export-blob';
import {
  canGeneratePila,
  derivePilaUiStatus,
  getActivePilaExport,
  hasPaidPilaHistory,
  PILA_FORMAT_LABELS,
  PILA_XLSX_MAX_EMPLOYEES,
} from '../utils/pila-display';

interface Props {
  period: string;
}

export function PilaPeriodPanel({ period }: Props): React.JSX.Element {
  const { theme } = useTheme();
  const panelTheme = theme === 'light' ? 'light' : 'dark';
  const { data: me } = useMe();
  const roleCode = me?.roleCode ?? getRoleCodeFromToken();
  const canWrite = canWritePayrollEmployee(roleCode);

  const [showErrors, setShowErrors] = useState(false);
  const [paidTarget, setPaidTarget] = useState<PilaPeriodExport | null>(null);
  const [voidTarget, setVoidTarget] = useState<PilaPeriodExport | null>(null);

  const exportsQuery = usePilaExportsQuery(period);
  const validationQuery = usePilaValidationQuery(period);
  const generateMutation = useGeneratePilaMutation(period);
  const markPaidMutation = useMarkPilaPaidMutation(period);
  const voidMutation = useVoidPilaMutation(period);
  const downloadMutation = useDownloadPilaMutation();
  const downloadAnexo2ReviewMutation = useDownloadPilaAnexo2ReviewMutation();

  const exports = exportsQuery.data ?? [];
  const activeTxt = useMemo(() => getActivePilaExport(exports, 'TXT'), [exports]);
  const activeXlsx = useMemo(() => getActivePilaExport(exports, 'XLSX'), [exports]);
  const activeAny = activeTxt ?? activeXlsx;
  const paidHistory = useMemo(() => hasPaidPilaHistory(exports), [exports]);
  const validationOk = validationQuery.data ? validationQuery.data.ok : null;
  const employeeCount =
    typeof validationQuery.data?.summary?.employeeCount === 'number'
      ? validationQuery.data.summary.employeeCount
      : (activeAny?.employeeCount ?? null);
  const xlsxBatchCount =
    typeof validationQuery.data?.summary?.xlsxBatchCount === 'number'
      ? validationQuery.data.summary.xlsxBatchCount
      : employeeCount !== null
        ? Math.max(1, Math.ceil(employeeCount / PILA_XLSX_MAX_EMPLOYEES))
        : null;
  const uiStatus = derivePilaUiStatus({ active: activeAny, validationOk });
  const canGenerateTxt = canGeneratePila({
    canWrite,
    activeForFormat: activeTxt,
    validationOk,
    hasPaidHistory: paidHistory,
  });
  const canGenerateXlsx = canGeneratePila({
    canWrite,
    activeForFormat: activeXlsx,
    validationOk,
    hasPaidHistory: paidHistory,
  });

  const handleValidate = (): void => {
    setShowErrors(true);
    void validationQuery.refetch().then((result) => {
      if (result.data?.ok) {
        toast.success('Validación PILA correcta');
      } else if (result.data && !result.data.ok) {
        toast.warning('Validación PILA con errores');
      }
    });
  };

  const handleGenerate = async (format: PilaExportFormat): Promise<void> => {
    setShowErrors(true);
    const validation = await validationQuery.refetch();
    if (!validation.data?.ok) {
      toast.error('Corrige los errores de validación antes de exportar');
      return;
    }
    try {
      const created = await generateMutation.mutateAsync(format);
      toast.success(`${PILA_FORMAT_LABELS[format]} v${created.version} generada`);
    } catch (error) {
      const message =
        error instanceof PayrollApiError ? error.message : 'No se pudo generar la exportación PILA';
      toast.error(message);
    }
  };

  const handleDownload = async (row: PilaPeriodExport): Promise<void> => {
    try {
      const file = await downloadMutation.mutateAsync(row.id);
      // Preferir fileName del listado: Content-Disposition no siempre es legible (CORS).
      downloadExportBlob(file.blob, row.fileName || file.filename);
      toast.success(`${PILA_FORMAT_LABELS[row.format]} descargado`);
    } catch (error) {
      const message =
        error instanceof PayrollApiError ? error.message : 'No se pudo descargar el archivo PILA';
      toast.error(message);
    }
  };

  const handleDownloadAnexo2Review = async (row: PilaPeriodExport): Promise<void> => {
    try {
      const file = await downloadAnexo2ReviewMutation.mutateAsync(row.id);
      downloadExportBlob(file.blob, file.filename);
      toast.success('Excel de revisión Anexo 2 descargado');
    } catch (error) {
      const message =
        error instanceof PayrollApiError
          ? error.message
          : 'No se pudo descargar el Excel de revisión';
      toast.error(message);
    }
  };

  const panelClass = [styles.panel, styles[`theme--${panelTheme}`]].join(' ');

  if (exportsQuery.isLoading || validationQuery.isLoading) {
    return (
      <div className={panelClass}>
        <div className={styles.body}>
          <LoadingState message="Cargando PILA…" theme={panelTheme} layout="compact" />
        </div>
      </div>
    );
  }

  if (exportsQuery.isError) {
    return (
      <div className={panelClass}>
        <div className={styles.body}>
          <p className={styles.errorText}>No se pudo cargar el historial PILA.</p>
          <button
            type="button"
            className={styles.retryButton}
            onClick={() => void exportsQuery.refetch()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={panelClass}>
      <PilaPeriodStatusCard
        period={period}
        uiStatus={uiStatus}
        activeTxt={activeTxt}
        activeXlsx={activeXlsx}
        employeeCount={employeeCount}
        xlsxBatchCount={xlsxBatchCount}
        canWrite={canWrite}
        canGenerateTxt={canGenerateTxt}
        canGenerateXlsx={canGenerateXlsx}
        generatingFormat={generateMutation.isPending ? (generateMutation.variables ?? 'TXT') : null}
        downloadingId={downloadMutation.isPending ? (downloadMutation.variables ?? null) : null}
        downloadingReviewId={
          downloadAnexo2ReviewMutation.isPending
            ? (downloadAnexo2ReviewMutation.variables ?? null)
            : null
        }
        onValidate={handleValidate}
        onGenerate={(format) => void handleGenerate(format)}
        onDownload={(row) => void handleDownload(row)}
        onDownloadAnexo2Review={(row) => void handleDownloadAnexo2Review(row)}
      />

      <div className={styles.body}>
        <PilaDeadlineAlertBanner period={period} mode="inline" />

        {showErrors && validationQuery.data && !validationQuery.data.ok ? (
          <PilaValidationErrors errors={validationQuery.data.errors} />
        ) : null}

        <PilaExportHistory
          exports={exports}
          canWrite={canWrite}
          downloadingId={downloadMutation.isPending ? (downloadMutation.variables ?? null) : null}
          downloadingReviewId={
            downloadAnexo2ReviewMutation.isPending
              ? (downloadAnexo2ReviewMutation.variables ?? null)
              : null
          }
          onDownload={(row) => void handleDownload(row)}
          onDownloadAnexo2Review={(row) => void handleDownloadAnexo2Review(row)}
          onMarkPaid={setPaidTarget}
          onVoid={setVoidTarget}
        />
      </div>

      <PilaMarkPaidModal
        open={paidTarget !== null}
        submitting={markPaidMutation.isPending}
        onClose={() => setPaidTarget(null)}
        onConfirm={async (input) => {
          if (!paidTarget) {
            return;
          }
          await markPaidMutation.mutateAsync({ exportId: paidTarget.id, input });
        }}
      />

      <PilaVoidModal
        open={voidTarget !== null}
        submitting={voidMutation.isPending}
        isPaid={voidTarget?.status === 'PAID'}
        onClose={() => setVoidTarget(null)}
        onConfirm={async (input) => {
          if (!voidTarget) {
            return;
          }
          await voidMutation.mutateAsync({ exportId: voidTarget.id, input });
        }}
      />
    </div>
  );
}
