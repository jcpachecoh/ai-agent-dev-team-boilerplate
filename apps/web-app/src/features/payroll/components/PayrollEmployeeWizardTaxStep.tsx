import { RecetaFilterSelect } from '@restopsiq/ui';

import type { PayrollEmployeeCreateTaxDraft } from '../types/payroll-employee-create-wizard.types';
import styles from './PayrollEmployeeWizardTaxStep.module.scss';

const TAX_REGIME_OPTIONS = [
  { value: 'ORDINARIO', label: 'Ordinario' },
  { value: 'SIMPLE', label: 'Simple' },
];

interface PayrollEmployeeWizardTaxStepProps {
  theme: 'light' | 'dark';
  values: PayrollEmployeeCreateTaxDraft;
  errors: Partial<Record<keyof PayrollEmployeeCreateTaxDraft, string>>;
  hint?: string;
  onChange: (values: PayrollEmployeeCreateTaxDraft) => void;
}

export function PayrollEmployeeWizardTaxStep({
  theme,
  values,
  errors,
  hint,
  onChange,
}: PayrollEmployeeWizardTaxStepProps): React.JSX.Element {
  return (
    <div className={styles.form}>
      <p className={styles.hint}>
        {hint ??
          'Opcional. Registra el NIT/RUT y la retención en la fuente si aplica para este colaborador.'}
      </p>

      <label className={styles.field}>
        <span className={styles.label}>NIT / RUT</span>
        <input
          className={styles.input}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={values.taxId}
          placeholder="Solo dígitos"
          onChange={(event) => onChange({ ...values, taxId: event.target.value })}
        />
        {errors.taxId ? <p className={styles.error}>{errors.taxId}</p> : null}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Régimen tributario</span>
        <RecetaFilterSelect
          aria-label="Régimen tributario"
          options={TAX_REGIME_OPTIONS}
          value={values.taxRegime}
          onChange={(value) => onChange({ ...values, taxRegime: value })}
          theme={theme}
          size="md"
        />
      </label>

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={values.withholdingApplicable}
          onChange={(event) =>
            onChange({
              ...values,
              withholdingApplicable: event.target.checked,
              withholdingRatePercent: event.target.checked ? values.withholdingRatePercent : '',
            })
          }
        />
        <span>Aplica retención en la fuente</span>
      </label>

      {values.withholdingApplicable ? (
        <label className={styles.field}>
          <span className={styles.label}>Porcentaje de retención</span>
          <input
            className={styles.input}
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={values.withholdingRatePercent}
            placeholder="Ej: 3.5"
            onChange={(event) =>
              onChange({ ...values, withholdingRatePercent: event.target.value })
            }
          />
          {errors.withholdingRatePercent ? (
            <p className={styles.error}>{errors.withholdingRatePercent}</p>
          ) : null}
        </label>
      ) : null}
    </div>
  );
}
