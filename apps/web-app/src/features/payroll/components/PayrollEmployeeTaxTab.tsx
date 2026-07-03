import { Button, EmptyState, RecetaFormButton, RecetaTextInput, toast } from '@restopsiq/ui';
import { Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { canWriteFinancialProfile } from '@/config/rbac.config';
import { useMe } from '@/features/auth/hooks/useMe';
import { getRoleCodeFromToken } from '@/lib/auth-token';
import { getErrorMessage } from '@/lib/graphql-client';

import { PayrollApiError } from '../api/payroll.client';
import {
  useEmployeeTaxInformationMutation,
  useEmployeeTaxInformationQuery,
} from '../hooks/useEmployeeTaxInformationQuery';
import { usePayrollEmployeeQuery } from '../hooks/usePayrollEmployeeQuery';
import type {
  EmployeeTaxInformation,
  TaxInformationFormValues,
} from '../types/financial-profile.types';
import {
  formatWithholdingRate,
  parseWithholdingRatePercent,
} from '../utils/financial-profile-display';
import { PayrollEmployeeProfileTabLoading } from './PayrollEmployeeProfileTabLoading';
import styles from './PayrollEmployeeTaxTab.module.scss';

const EMPTY_FORM: TaxInformationFormValues = {
  taxId: '',
  taxRegime: 'ORDINARIO',
  withholdingApplicable: false,
  withholdingRatePercent: '',
};

const TAX_REGIME_OPTIONS = ['ORDINARIO', 'SIMPLE'] as const;

interface PayrollEmployeeTaxTabProps {
  userId: string;
  theme: 'light' | 'dark';
}

export function PayrollEmployeeTaxTab({
  userId,
  theme,
}: PayrollEmployeeTaxTabProps): React.JSX.Element {
  const { data: me } = useMe();
  const roleCode = me?.roleCode ?? getRoleCodeFromToken();
  const canWrite = canWriteFinancialProfile(roleCode);

  const employeeQuery = usePayrollEmployeeQuery(userId);
  const employeeId = employeeQuery.data?.id;
  const taxQuery = useEmployeeTaxInformationQuery(employeeId);
  const taxMutation = useEmployeeTaxInformationMutation(employeeId ?? '');

  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<TaxInformationFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof TaxInformationFormValues, string>>>({});

  useEffect(() => {
    if (!taxQuery.data) return;
    setValues(toFormValues(taxQuery.data));
  }, [taxQuery.data]);

  if (employeeQuery.isLoading) {
    return <PayrollEmployeeProfileTabLoading />;
  }

  if (employeeQuery.isError || !employeeQuery.data || !employeeId) {
    return (
      <div className={styles.state}>
        <p>No se pudo cargar el colaborador.</p>
        <Button variant="secondary" size="small" onClick={() => void employeeQuery.refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (taxQuery.isLoading) {
    return <PayrollEmployeeProfileTabLoading />;
  }

  if (taxQuery.isError) {
    return (
      <div className={styles.state}>
        <p>{getTaxErrorMessage(taxQuery.error)}</p>
        <p className={styles.hint}>Requiere permiso nomina.financial.tax.read.</p>
        <Button variant="secondary" size="small" onClick={() => void taxQuery.refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  const taxInfo = taxQuery.data;

  const handleSubmit = async () => {
    const nextErrors = validateTaxForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const withholdingRate = values.withholdingApplicable
      ? parseWithholdingRatePercent(values.withholdingRatePercent)
      : undefined;

    if (values.withholdingApplicable && withholdingRate == null) {
      setErrors({ withholdingRatePercent: 'Ingresa un porcentaje entre 0 y 100' });
      return;
    }

    try {
      await taxMutation.mutateAsync({
        taxId: values.taxId.trim(),
        taxRegime: values.taxRegime.trim() || undefined,
        withholdingApplicable: values.withholdingApplicable,
        withholdingRate,
      });
      toast.success('Información fiscal guardada');
      setEditing(false);
    } catch (error) {
      toast.error(getTaxErrorMessage(error));
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Información fiscal</h2>
          <p className={styles.subtitle}>
            NIT/RUT y configuración de retención en la fuente. Los datos sensibles se muestran
            enmascarados.
          </p>
        </div>
        {canWrite && !editing ? (
          <RecetaFormButton
            type="button"
            theme={theme}
            variant="add"
            label={taxInfo ? 'Editar' : 'Registrar'}
            onClick={() => {
              setValues(taxInfo ? toFormValues(taxInfo) : EMPTY_FORM);
              setErrors({});
              setEditing(true);
            }}
          />
        ) : null}
      </div>

      {!editing && !taxInfo ? (
        <EmptyState
          theme={theme}
          variant="create"
          icon={<Building2 size={44} strokeWidth={1.5} />}
          title="Sin información fiscal registrada"
          description="Registra el NIT/RUT y la configuración de retención del colaborador."
          action={
            canWrite ? (
              <RecetaFormButton
                type="button"
                theme={theme}
                variant="add"
                label="Registrar información"
                onClick={() => {
                  setValues(EMPTY_FORM);
                  setErrors({});
                  setEditing(true);
                }}
              />
            ) : undefined
          }
          className={styles.emptyState}
        />
      ) : null}

      {!editing && taxInfo ? (
        <div className={styles.detailsGrid}>
          <div className={styles.field}>
            <span className={styles.label}>NIT / RUT</span>
            <div className={`${styles.value} ${styles.masked}`}>{taxInfo.maskedTaxId}</div>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Régimen</span>
            <div className={styles.value}>{taxInfo.taxRegime?.trim() || '—'}</div>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Retención en la fuente</span>
            <div className={styles.value}>
              {taxInfo.withholdingApplicable ? 'Aplica' : 'No aplica'}
            </div>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Tasa de retención</span>
            <div className={styles.value}>{formatWithholdingRate(taxInfo.withholdingRate)}</div>
          </div>
        </div>
      ) : null}

      {editing ? (
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <div className={styles.grid}>
            <label className={styles.field}>
              <span className={styles.label}>NIT / RUT</span>
              <RecetaTextInput
                theme={theme}
                value={values.taxId}
                placeholder={taxInfo ? 'Ingresa el NIT completo para actualizar' : '9001234567'}
                onChange={(event) =>
                  setValues((current) => ({ ...current, taxId: event.target.value }))
                }
              />
              {errors.taxId ? <p className={styles.error}>{errors.taxId}</p> : null}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Régimen tributario</span>
              <select
                className={styles.select}
                value={values.taxRegime}
                onChange={(event) =>
                  setValues((current) => ({ ...current, taxRegime: event.target.value }))
                }
              >
                {TAX_REGIME_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                checked={values.withholdingApplicable}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    withholdingApplicable: event.target.checked,
                  }))
                }
              />
              <span>Aplica retención en la fuente</span>
            </label>

            {values.withholdingApplicable ? (
              <label className={styles.field}>
                <span className={styles.label}>Tasa de retención (%)</span>
                <RecetaTextInput
                  theme={theme}
                  value={values.withholdingRatePercent}
                  placeholder="11"
                  inputMode="decimal"
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      withholdingRatePercent: event.target.value,
                    }))
                  }
                />
                {errors.withholdingRatePercent ? (
                  <p className={styles.error}>{errors.withholdingRatePercent}</p>
                ) : null}
              </label>
            ) : null}
          </div>

          <div className={styles.formActions}>
            <Button
              type="button"
              variant="secondary"
              size="small"
              className={styles.actionButton}
              disabled={taxMutation.isPending}
              onClick={() => {
                setEditing(false);
                setErrors({});
                setValues(taxInfo ? toFormValues(taxInfo) : EMPTY_FORM);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="small"
              className={styles.actionButton}
              loading={taxMutation.isPending}
            >
              Guardar
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function toFormValues(taxInfo: EmployeeTaxInformation): TaxInformationFormValues {
  return {
    taxId: '',
    taxRegime: taxInfo.taxRegime?.trim() || 'ORDINARIO',
    withholdingApplicable: taxInfo.withholdingApplicable,
    withholdingRatePercent:
      taxInfo.withholdingRate != null ? String(taxInfo.withholdingRate * 100) : '',
  };
}

function validateTaxForm(
  values: TaxInformationFormValues,
): Partial<Record<keyof TaxInformationFormValues, string>> {
  const errors: Partial<Record<keyof TaxInformationFormValues, string>> = {};
  if (!values.taxId.trim()) {
    errors.taxId = 'El NIT/RUT es obligatorio';
  } else if (!/^\d{6,15}$/.test(values.taxId.trim())) {
    errors.taxId = 'Ingresa solo dígitos (6-15 caracteres)';
  }
  return errors;
}

function getTaxErrorMessage(error: unknown): string {
  if (error instanceof PayrollApiError) {
    if (error.status === 403) {
      return 'No tienes permisos para consultar la información fiscal de este empleado.';
    }
    return error.message;
  }
  return getErrorMessage(error);
}
