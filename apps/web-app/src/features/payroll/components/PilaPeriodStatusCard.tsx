import { Button } from '@restopsiq/ui';

import styles from './PilaPeriodStatusCard.module.scss';
import { PilaStatusBadge } from './PilaStatusBadge';
import type { PilaExportFormat, PilaPeriodExport, PilaUiStatus } from '../types/pila.types';
import {
  formatPilaDateTime,
  formatPilaMoney,
  PILA_FORMAT_LABELS,
  PILA_STATUS_LABELS,
  PILA_XLSX_MAX_EMPLOYEES,
} from '../utils/pila-display';

interface Props {
  period: string;
  uiStatus: PilaUiStatus;
  activeTxt: PilaPeriodExport | null;
  activeXlsx: PilaPeriodExport | null;
  employeeCount: number | null;
  xlsxBatchCount: number | null;
  canWrite: boolean;
  canGenerateTxt: boolean;
  canGenerateXlsx: boolean;
  generatingFormat?: PilaExportFormat | null;
  downloadingId?: string | null;
  downloadingReviewId?: string | null;
  onValidate: () => void;
  onGenerate: (format: PilaExportFormat) => void;
  onDownload: (row: PilaPeriodExport) => void;
  onDownloadAnexo2Review: (row: PilaPeriodExport) => void;
}

export function PilaPeriodStatusCard({
  period,
  uiStatus,
  activeTxt,
  activeXlsx,
  employeeCount,
  xlsxBatchCount,
  canWrite,
  canGenerateTxt,
  canGenerateXlsx,
  generatingFormat = null,
  downloadingId = null,
  downloadingReviewId = null,
  onValidate,
  onGenerate,
  onDownload,
  onDownloadAnexo2Review,
}: Props): React.JSX.Element {
  const anyActive = activeTxt ?? activeXlsx;
  const needsXlsxBatches = xlsxBatchCount !== null && xlsxBatchCount > 1;
  const activeXlsxIsZip = Boolean(activeXlsx?.fileName.toLowerCase().endsWith('.zip'));

  return (
    <section className={styles.card} aria-label={`Estado PILA período ${period}`}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>PILA · Aportes en Línea</p>
          <h3 className={styles.title}>Período {period}</h3>
        </div>
        <PilaStatusBadge status={uiStatus} />
      </header>

      <div className={styles.content}>
        <p className={styles.description}>
          {uiStatus === 'PENDING'
            ? 'Aún no hay una exportación generada para este período.'
            : uiStatus === 'VALIDATION_FAILED'
              ? 'La validación encontró errores. Corrige los datos antes de exportar.'
              : uiStatus === 'PAID'
                ? 'Período pagado. Puedes descargar archivos históricos; no se permite regenerar.'
                : `Estado: ${PILA_STATUS_LABELS[uiStatus]}.`}
        </p>

        <p className={styles.hint}>
          TXT y XLSX representan la misma liquidación. Generar uno no invalida el otro; cada formato
          tiene versionado independiente. La plantilla Excel admite {PILA_XLSX_MAX_EMPLOYEES}{' '}
          empleados por archivo; si hay más, se genera un ZIP con varios lotes.
        </p>

        {needsXlsxBatches ? (
          <p id="pila-xlsx-batch-info" className={styles.warning} role="status">
            Este período tiene {employeeCount} empleados. La plantilla XLSX se generará en{' '}
            {xlsxBatchCount} archivos de hasta {PILA_XLSX_MAX_EMPLOYEES} (descarga ZIP). Sube cada
            lote por separado en Aportes en Línea.
          </p>
        ) : null}

        {anyActive ? (
          <dl className={styles.meta}>
            {activeTxt ? (
              <div>
                <dt>{PILA_FORMAT_LABELS.TXT}</dt>
                <dd>
                  v{activeTxt.version} · {formatPilaDateTime(activeTxt.generatedAt)}
                </dd>
              </div>
            ) : null}
            {activeXlsx ? (
              <div>
                <dt>{PILA_FORMAT_LABELS.XLSX}</dt>
                <dd>
                  v{activeXlsx.version} · {formatPilaDateTime(activeXlsx.generatedAt)}
                  {activeXlsxIsZip ? ' · ZIP multi-lote' : ''}
                </dd>
              </div>
            ) : null}
            <div>
              <dt>Empleados</dt>
              <dd>{anyActive.employeeCount}</dd>
            </div>
            <div>
              <dt>Total aportes</dt>
              <dd>{formatPilaMoney(anyActive.totalContribution)}</dd>
            </div>
          </dl>
        ) : null}

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onValidate}>
            Validar PILA
          </Button>
          {canWrite ? (
            <>
              <Button
                type="button"
                variant="primary"
                onClick={() => onGenerate('TXT')}
                disabled={!canGenerateTxt || generatingFormat !== null}
              >
                {generatingFormat === 'TXT'
                  ? 'Generando TXT…'
                  : `Generar ${PILA_FORMAT_LABELS.TXT}`}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => onGenerate('XLSX')}
                disabled={!canGenerateXlsx || generatingFormat !== null}
                aria-describedby={needsXlsxBatches ? 'pila-xlsx-batch-info' : undefined}
                title={
                  needsXlsxBatches
                    ? `Generará un ZIP con ${xlsxBatchCount} plantillas XLSX de hasta ${PILA_XLSX_MAX_EMPLOYEES} empleados`
                    : undefined
                }
              >
                {generatingFormat === 'XLSX'
                  ? 'Generando XLSX…'
                  : needsXlsxBatches
                    ? `Generar XLSX (${xlsxBatchCount} lotes ZIP)`
                    : `Generar ${PILA_FORMAT_LABELS.XLSX}`}
              </Button>
            </>
          ) : null}
          {activeTxt ? (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onDownload(activeTxt)}
                disabled={downloadingId === activeTxt.id || downloadingReviewId === activeTxt.id}
              >
                {downloadingId === activeTxt.id
                  ? 'Descargando…'
                  : `Descargar ${PILA_FORMAT_LABELS.TXT}`}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onDownloadAnexo2Review(activeTxt)}
                disabled={downloadingId === activeTxt.id || downloadingReviewId === activeTxt.id}
                title="Excel legible del Anexo Técnico 2 (revisión; no sustituye el TXT oficial)"
              >
                {downloadingReviewId === activeTxt.id
                  ? 'Descargando Excel…'
                  : 'Descargar Anexo 2 (Excel)'}
              </Button>
            </>
          ) : null}
          {activeXlsx ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => onDownload(activeXlsx)}
              disabled={downloadingId === activeXlsx.id}
            >
              {downloadingId === activeXlsx.id
                ? 'Descargando…'
                : activeXlsxIsZip
                  ? 'Descargar Plantilla XLSX (ZIP lotes)'
                  : `Descargar ${PILA_FORMAT_LABELS.XLSX}`}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
