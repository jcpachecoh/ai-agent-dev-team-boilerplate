import { RecetaFilterSelect } from '@restopsiq/ui';
import { useMemo, useState } from 'react';

import { buildBankSelectOptions } from '../constants/colombian-banks';
import type { PayrollEmployeeCreateBankDraft } from '../types/payroll-employee-create-wizard.types';
import { ACCOUNT_TYPE_OPTIONS, resolveBankName } from '../utils/bank-account-validation';
import styles from './PayrollEmployeeWizardBankStep.module.scss';

interface PayrollEmployeeWizardBankStepProps {
  theme: 'light' | 'dark';
  values: PayrollEmployeeCreateBankDraft;
  errors: Partial<Record<keyof PayrollEmployeeCreateBankDraft, string>>;
  hint?: string;
  onChange: (values: PayrollEmployeeCreateBankDraft) => void;
}

export function PayrollEmployeeWizardBankStep({
  theme,
  values,
  errors,
  hint,
  onChange,
}: PayrollEmployeeWizardBankStepProps): React.JSX.Element {
  const bankOptions = useMemo(
    () => buildBankSelectOptions(values.bankCode, resolveBankName(values.bankCode)),
    [values.bankCode],
  );

  const [isEditingAccountNumber, setIsEditingAccountNumber] = useState(false);
  const showMasked =
    Boolean(values.maskedAccountNumber) && !values.accountNumber && !isEditingAccountNumber;

  return (
    <div className={styles.form}>
      <p className={styles.hint}>
        {hint ??
          'Opcional. Puedes registrar la cuenta ahora o completarla después en el perfil del empleado.'}
      </p>

      <label className={styles.field}>
        <span className={styles.label}>Banco</span>
        <RecetaFilterSelect
          aria-label="Banco"
          options={bankOptions}
          value={values.bankCode}
          onChange={(value) => onChange({ ...values, bankCode: value })}
          theme={theme}
          size="md"
        />
        {errors.bankCode ? <p className={styles.error}>{errors.bankCode}</p> : null}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Tipo de cuenta</span>
        <RecetaFilterSelect
          aria-label="Tipo de cuenta"
          options={[...ACCOUNT_TYPE_OPTIONS]}
          value={values.accountType}
          onChange={(value) =>
            onChange({
              ...values,
              accountType: value as PayrollEmployeeCreateBankDraft['accountType'],
            })
          }
          theme={theme}
          size="md"
        />
        {errors.accountType ? <p className={styles.error}>{errors.accountType}</p> : null}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Número de cuenta</span>
        <input
          className={styles.input}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={showMasked ? values.maskedAccountNumber : values.accountNumber}
          placeholder="Solo dígitos"
          readOnly={showMasked}
          onFocus={() => {
            if (showMasked) setIsEditingAccountNumber(true);
          }}
          onChange={(event) => onChange({ ...values, accountNumber: event.target.value })}
        />
        {errors.accountNumber ? <p className={styles.error}>{errors.accountNumber}</p> : null}
        {values.bankAccountId && showMasked ? (
          <p className={styles.hint}>Haz clic para editar el número de cuenta.</p>
        ) : null}
      </label>
    </div>
  );
}
