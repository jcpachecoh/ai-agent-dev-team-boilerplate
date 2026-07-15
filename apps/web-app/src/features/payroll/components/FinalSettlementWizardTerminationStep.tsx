import type { FinalSettlementTerminationFormValues } from './FinalSettlementWizard';
import styles from './FinalSettlementWizardTerminationStep.module.scss';
import type { PayrollEmployee } from '../types/payroll.types';
import { CONTRACT_TERMINATION_REASON_OPTIONS } from '../utils/final-settlement-display';

interface Props {
  employee: PayrollEmployee;
  values: FinalSettlementTerminationFormValues;
  onChange: (values: FinalSettlementTerminationFormValues) => void;
  mode: 'AUTOMATIC' | 'MANUAL';
  onModeChange: (mode: 'AUTOMATIC' | 'MANUAL') => void;
  disabled?: boolean;
}

/** OS-591 (fase 4) — paso 1 del wizard: datos de terminación del contrato. Solo pide días
 * restantes estimados cuando el contrato del empleado es OBRA/LABOR (backend lo exige). */
export function FinalSettlementWizardTerminationStep({
  employee,
  values,
  onChange,
  mode,
  onModeChange,
  disabled = false,
}: Props): React.JSX.Element {
  const isObra = employee.contractType === 'OBRA';

  return (
    <div className={styles.stepBody}>
      <p className={styles.employeeName}>{employee.name}</p>
      <p className={styles.employeeMeta}>
        {employee.position} · Contrato {employee.contractType}
      </p>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Fecha efectiva de terminación</span>
          <input
            type="date"
            className={styles.input}
            value={values.effectiveTerminationDate}
            onChange={(event) =>
              onChange({ ...values, effectiveTerminationDate: event.target.value })
            }
            disabled={disabled}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Causal de terminación</span>
          <select
            className={styles.input}
            value={values.terminationReason}
            onChange={(event) =>
              onChange({
                ...values,
                terminationReason: event.target
                  .value as FinalSettlementTerminationFormValues['terminationReason'],
              })
            }
            disabled={disabled}
          >
            <option value="">Selecciona una causal</option>
            {CONTRACT_TERMINATION_REASON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isObra ? (
        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Días restantes estimados</span>
            <input
              type="number"
              min={0}
              className={styles.input}
              value={values.estimatedRemainingDays}
              onChange={(event) =>
                onChange({ ...values, estimatedRemainingDays: event.target.value })
              }
              disabled={disabled}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Justificación</span>
            <input
              className={styles.input}
              value={values.estimatedRemainingDaysJustification}
              onChange={(event) =>
                onChange({ ...values, estimatedRemainingDaysJustification: event.target.value })
              }
              placeholder="Sustento de la estimación de días restantes"
              disabled={disabled}
            />
          </label>
        </div>
      ) : null}

      <div className={styles.modeToggle}>
        <button
          type="button"
          className={`${styles.modeButton} ${mode === 'AUTOMATIC' ? styles.modeButtonActive : ''}`}
          onClick={() => onModeChange('AUTOMATIC')}
          disabled={disabled}
        >
          Cálculo automático
        </button>
        <button
          type="button"
          className={`${styles.modeButton} ${mode === 'MANUAL' ? styles.modeButtonActive : ''}`}
          onClick={() => onModeChange('MANUAL')}
          disabled={disabled}
        >
          Liquidación manual
        </button>
      </div>
      <p className={styles.hint}>
        {mode === 'AUTOMATIC'
          ? 'El backend calcula la liquidación a partir del historial de nómina del empleado.'
          : 'Úsala cuando el cálculo automático no aplica — cada línea requiere justificación auditable.'}
      </p>
    </div>
  );
}
