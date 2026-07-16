import { LoadingState } from '@restopsiq/ui';

import { useTheme } from '@/providers/ThemeProvider';

import styles from './SenaQuotaPanel.module.scss';
import { SenaQuotaStatusBadge } from './SenaQuotaStatusBadge';
import { useSenaQuotaQuery } from '../hooks/usePayrollReportQueries';
import {
  formatSenaQuotaMoney,
  SENA_QUOTA_DISCLAIMER,
  SENA_QUOTA_REGIME_LABELS,
} from '../utils/sena-quota-display';

interface Props {
  period: string;
}

export function SenaQuotaPanel({ period }: Props): React.JSX.Element {
  const { theme } = useTheme();
  const panelTheme = theme === 'light' ? 'light' : 'dark';
  const query = useSenaQuotaQuery(period);

  if (query.isLoading) {
    return (
      <section
        className={[styles.panel, styles[`theme--${panelTheme}`]].join(' ')}
        aria-label="Cumplimiento cuota SENA"
      >
        <LoadingState
          message="Cargando estimación de cuota SENA…"
          theme={panelTheme}
          layout="compact"
        />
      </section>
    );
  }

  if (query.isError || !query.data) {
    return (
      <section
        className={[styles.panel, styles[`theme--${panelTheme}`]].join(' ')}
        aria-label="Cumplimiento cuota SENA"
      >
        <p className={styles.errorText}>No se pudo cargar la estimación de cuota SENA.</p>
        <button type="button" className={styles.retryButton} onClick={() => void query.refetch()}>
          Reintentar
        </button>
      </section>
    );
  }

  const data = query.data;
  const showMonetization = data.estimatedMonetizationAmount > 0;

  return (
    <section
      className={[styles.panel, styles[`theme--${panelTheme}`]].join(' ')}
      aria-label="Cumplimiento cuota SENA"
    >
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Estimación informativa</p>
          <h3 className={styles.title}>Cumplimiento cuota SENA</h3>
        </div>
        <SenaQuotaStatusBadge status={data.status} />
      </header>

      <dl className={styles.meta}>
        <div>
          <dt>Trabajadores computables</dt>
          <dd>{data.eligibleWorkers}</dd>
        </div>
        <div>
          <dt>Aprendices requeridos</dt>
          <dd>{data.requiredApprentices}</dd>
        </div>
        <div>
          <dt>Aprendices activos</dt>
          <dd>{data.activeApprentices}</dd>
        </div>
        <div>
          <dt>Aprendices faltantes</dt>
          <dd>{data.missingApprentices}</dd>
        </div>
      </dl>

      {showMonetization ? (
        <div className={styles.monetization}>
          <p className={styles.monetizationLabel}>Valor estimado a monetizar</p>
          <p className={styles.monetizationValue}>
            {formatSenaQuotaMoney(data.estimatedMonetizationAmount)}
          </p>
          <p className={styles.regime}>{SENA_QUOTA_REGIME_LABELS[data.monetizationRegime]}</p>
        </div>
      ) : null}

      <p className={styles.disclaimer}>{SENA_QUOTA_DISCLAIMER}</p>
    </section>
  );
}
