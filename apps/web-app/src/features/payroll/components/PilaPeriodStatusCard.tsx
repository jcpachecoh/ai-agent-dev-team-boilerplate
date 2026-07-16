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
  canWrite: boolean;
  canGenerateTxt: boolean;
  canGenerateXlsx: boolean;
  generatingFormat?: PilaExportFormat | null;
  downloadingId?: string | null;
  onValidate: () => void;
  onGenerate: (format: PilaExportFormat) => void;
  onDownload: (row: PilaPeriodExport) => void;
}

export function PilaPeriodStatusCard({
  period,
  uiStatus,
  activeTxt,
  activeXlsx,
  employeeCount,
  canWrite,
  canGenerateTxt,
  canGenerateXlsx,
  generatingFormat = null,
  downloadingId = null,
  onValidate,
  onGenerate,
  onDownload,
}: Props): React.JSX.Element {
  const anyActive = activeTxt ?? activeXlsx;
  const exceedsXlsxLimit = employeeCount !== null && employeeCount > PILA_XLSX_MAX_EMPLOYEES;

  return (
    <section className={styles.card} aria-label={`Estado PILA período ${period}`}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>PILA · Aportes en Línea</p>
          <h3 className={styles.title}>Período {period}</h3>
        </div>
        <PilaStatusBadge status={uiStatus} />
      </header>

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
        tiene versionado independiente. La plantilla XLSX admite máximo {PILA_XLSX_MAX_EMPLOYEES}{' '}
        empleados.
      </p>

      {exceedsXlsxLimit ? (
        <p className={styles.warning} role="status">
          Este período tiene {employeeCount} empleados. La plantilla XLSX solo admite{' '}
          {PILA_XLSX_MAX_EMPLOYEES}. Usa {PILA_FORMAT_LABELS.TXT}.
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
              {generatingFormat === 'TXT' ? 'Generando TXT…' : `Generar ${PILA_FORMAT_LABELS.TXT}`}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => onGenerate('XLSX')}
              disabled={!canGenerateXlsx || generatingFormat !== null || exceedsXlsxLimit}
              title={
                exceedsXlsxLimit ? `Máximo ${PILA_XLSX_MAX_EMPLOYEES} empleados en XLSX` : undefined
              }
            >
              {generatingFormat === 'XLSX'
                ? 'Generando XLSX…'
                : `Generar ${PILA_FORMAT_LABELS.XLSX}`}
            </Button>
          </>
        ) : null}
        {activeTxt ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => onDownload(activeTxt)}
            disabled={downloadingId === activeTxt.id}
          >
            {downloadingId === activeTxt.id
              ? 'Descargando…'
              : `Descargar ${PILA_FORMAT_LABELS.TXT}`}
          </Button>
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
              : `Descargar ${PILA_FORMAT_LABELS.XLSX}`}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
