import { Button, Modal, RecetaFilterSelect } from '@restopsiq/ui';
import { useEffect, useMemo, useState } from 'react';

import { buildBankSelectOptions } from '../constants/colombian-banks';
import type { BankAccountFormValues, EmployeeBankAccount } from '../types/bank-account.types';
import {
  ACCOUNT_TYPE_OPTIONS,
  resolveBankName,
  validateBankAccountForm,
} from '../utils/bank-account-validation';
import styles from './PayrollBankAccountFormModal.module.scss';

const EMPTY_FORM: BankAccountFormValues = {
  bankCode: '',
  accountType: 'SAVINGS',
  accountNumber: '',
  isPrimary: false,
};

function toFormValues(account: EmployeeBankAccount): BankAccountFormValues {
  return {
    bankCode: account.bankCode ?? account.bankName.toLowerCase().replace(/\s+/g, '_'),
    accountType: account.accountType,
    accountNumber: '',
    isPrimary: account.isPrimary,
  };
}

interface PayrollBankAccountFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  theme: 'light' | 'dark';
  account?: EmployeeBankAccount;
  isFirstAccount?: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: BankAccountFormValues) => void;
}

export function PayrollBankAccountFormModal({
  open,
  mode,
  theme,
  account,
  isFirstAccount = false,
  submitting = false,
  onClose,
  onSubmit,
}: PayrollBankAccountFormModalProps): React.JSX.Element | null {
  const [values, setValues] = useState<BankAccountFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof BankAccountFormValues, string>>>({});

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && account) {
      setValues(toFormValues(account));
    } else {
      setValues({ ...EMPTY_FORM, isPrimary: isFirstAccount });
    }
    setErrors({});
  }, [open, mode, account, isFirstAccount]);

  const bankOptions = useMemo(
    () => buildBankSelectOptions(values.bankCode, resolveBankName(values.bankCode)),
    [values.bankCode],
  );

  const handleSubmit = () => {
    const nextErrors = validateBankAccountForm(values, {
      requireAccountNumber: mode === 'create',
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit({
      ...values,
      accountNumber: values.accountNumber.replace(/\D/g, ''),
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !submitting) onClose();
      }}
      size="md"
      theme={theme}
      title={mode === 'create' ? 'Agregar cuenta bancaria' : 'Editar cuenta bancaria'}
      description={
        mode === 'create'
          ? 'La cuenta se usará para la dispersión de pago. El número se almacena encriptado.'
          : 'Deja el número en blanco si no deseas cambiarlo. Cambiar el número afecta la próxima dispersión.'
      }
      onInteractOutside={(event) => {
        if (submitting) event.preventDefault();
      }}
      footer={
        <>
          <Button variant="secondary" size="medium" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="primary" size="medium" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Guardando…' : 'Continuar'}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <label className={styles.field}>
          <span className={styles.label}>Banco</span>
          <RecetaFilterSelect
            aria-label="Banco"
            options={bankOptions}
            value={values.bankCode}
            onChange={(value) => {
              setValues((current) => ({ ...current, bankCode: value }));
              setErrors((current) => ({ ...current, bankCode: undefined }));
            }}
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
            onChange={(value) => {
              setValues((current) => ({
                ...current,
                accountType: value as BankAccountFormValues['accountType'],
              }));
              setErrors((current) => ({ ...current, accountType: undefined }));
            }}
            theme={theme}
            size="md"
          />
          {errors.accountType ? <p className={styles.error}>{errors.accountType}</p> : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>
            Número de cuenta{mode === 'create' ? '' : ' (opcional)'}
          </span>
          <input
            className={styles.input}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={values.accountNumber}
            placeholder={mode === 'edit' ? 'Sin cambios si se deja vacío' : 'Solo dígitos'}
            onChange={(event) => {
              setValues((current) => ({ ...current, accountNumber: event.target.value }));
              setErrors((current) => ({ ...current, accountNumber: undefined }));
            }}
          />
          {errors.accountNumber ? <p className={styles.error}>{errors.accountNumber}</p> : null}
        </label>

        {mode === 'create' ? (
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={values.isPrimary || isFirstAccount}
              disabled={isFirstAccount}
              onChange={(event) =>
                setValues((current) => ({ ...current, isPrimary: event.target.checked }))
              }
            />
            <span>Marcar como cuenta principal de dispersión</span>
          </label>
        ) : null}
      </div>
    </Modal>
  );
}
