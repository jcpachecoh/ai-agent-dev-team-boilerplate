import styles from './PayrollTaxWithholdingBreakdownSection.module.scss';
import type { TaxWithholdingBreakdown } from '../types/payroll-reports.types';
import { formatTaxWithholdingSummary } from '../utils/payroll-tax-withholding-display';

interface Props {
  breakdown: TaxWithholdingBreakdown;
}

/**
 * OS-594 — muestra el desglose tributario retornado por la API sin recalcular montos.
 */
export function PayrollTaxWithholdingBreakdownSection({ breakdown }: Props): React.JSX.Element {
  const summary = formatTaxWithholdingSummary(breakdown);

  return (
    <section className={styles.section} aria-labelledby="tax-withholding-heading">
      <h3 id="tax-withholding-heading">Retención en la fuente</h3>

      <dl className={styles.grid}>
        <div className={styles.item}>
          <dt>Base gravable</dt>
          <dd>{summary.baseCop}</dd>
        </div>
        <div className={styles.item}>
          <dt>UVT aplicadas</dt>
          <dd>{summary.uvtValue}</dd>
        </div>
        <div className={styles.item}>
          <dt>Tramo aplicado</dt>
          <dd>{summary.bracket}</dd>
        </div>
        <div className={styles.item}>
          <dt>Retención calculada</dt>
          <dd className={styles.withholdingAmount}>{summary.withholdingCop}</dd>
        </div>
      </dl>
    </section>
  );
}
