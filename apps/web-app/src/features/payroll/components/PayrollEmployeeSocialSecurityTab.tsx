import { RecetaFilterSelect, RecetaFormButton, StatusBadge, toast } from '@restopsiq/ui';
import { useEffect, useMemo, useState } from 'react';

import { canWritePayrollEmployee } from '@/config/rbac.config';
import { useMe } from '@/features/auth/hooks/useMe';
import { getRoleCodeFromToken } from '@/lib/auth-token';

import { PayrollApiError } from '../api/payroll.client';
import {
  buildCatalogSelectOptions,
  catalogSelectPlaceholder,
  useEmployeeCatalogsGrouped,
} from '../hooks/useEmployeeCatalogOptions';
import { useUpdatePayrollEmployeeMutation } from '../hooks/usePayrollEmployeeMutations';
import { usePayrollEmployeeQuery } from '../hooks/usePayrollEmployeeQuery';
import type { ArlRiskLevel, UpdatePayrollEmployeeInput } from '../types/payroll.types';
import {
  buildSocialSecurityAffiliations,
  formatAffiliationDate,
  type SocialSecurityAffiliationFieldKey,
} from '../utils/social-security-affiliations';
import { PayrollEmployeeProfileTabLoading } from './PayrollEmployeeProfileTabLoading';
import styles from './PayrollEmployeeSocialSecurityTab.module.scss';

const ARL_LEVEL_OPTIONS: Array<{ value: ArlRiskLevel; label: string }> = [
  { value: 'RIESGO_I', label: 'Riesgo I' },
  { value: 'RIESGO_II', label: 'Riesgo II' },
  { value: 'RIESGO_III', label: 'Riesgo III' },
  { value: 'RIESGO_IV', label: 'Riesgo IV' },
  { value: 'RIESGO_V', label: 'Riesgo V' },
];

interface SocialSecurityFormValues {
  epsName: string;
  pensionFundName: string;
  arlName: string;
  arlRiskLevel: ArlRiskLevel;
  cajaCompensacion: string;
}

function toFormValues(employee: {
  epsName: string;
  pensionFundName: string;
  arlName: string;
  arlRiskLevel: ArlRiskLevel;
  cajaCompensacion: string;
}): SocialSecurityFormValues {
  return {
    epsName: employee.epsName,
    pensionFundName: employee.pensionFundName,
    arlName: employee.arlName,
    arlRiskLevel: employee.arlRiskLevel,
    cajaCompensacion: employee.cajaCompensacion,
  };
}

function validateForm(values: SocialSecurityFormValues): Partial<Record<string, string>> {
  const errors: Partial<Record<string, string>> = {};
  if (!values.epsName.trim()) errors.epsName = 'Requerido';
  if (!values.pensionFundName.trim()) errors.pensionFundName = 'Requerido';
  if (!values.arlName.trim()) errors.arlName = 'Requerido';
  if (!values.cajaCompensacion.trim()) errors.cajaCompensacion = 'Requerido';
  return errors;
}

interface PayrollEmployeeSocialSecurityTabProps {
  userId: string;
  theme: 'light' | 'dark';
}

export function PayrollEmployeeSocialSecurityTab({
  userId,
  theme,
}: PayrollEmployeeSocialSecurityTabProps): React.JSX.Element {
  const { data: me } = useMe();
  const roleCode = me?.roleCode ?? getRoleCodeFromToken();
  const canEdit = canWritePayrollEmployee(roleCode);

  const employeeQuery = usePayrollEmployeeQuery(userId);
  const catalogsQuery = useEmployeeCatalogsGrouped();
  const updateMutation = useUpdatePayrollEmployeeMutation();

  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<SocialSecurityFormValues | null>(null);
  const [errors, setErrors] = useState<Partial<Record<SocialSecurityAffiliationFieldKey, string>>>(
    {},
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (employeeQuery.data) {
      setValues(toFormValues(employeeQuery.data));
    }
  }, [employeeQuery.data]);

  const affiliations = useMemo(
    () => (employeeQuery.data ? buildSocialSecurityAffiliations(employeeQuery.data) : []),
    [employeeQuery.data],
  );
  const arlAffiliation = affiliations.find((affiliation) => affiliation.key === 'arl');

  const epsSelectOptions = useMemo(
    () => buildCatalogSelectOptions(catalogsQuery.grouped.EPS ?? [], values?.epsName ?? ''),
    [catalogsQuery.grouped, values?.epsName],
  );
  const pensionSelectOptions = useMemo(
    () =>
      buildCatalogSelectOptions(
        catalogsQuery.grouped.PENSION_FUND ?? [],
        values?.pensionFundName ?? '',
      ),
    [catalogsQuery.grouped, values?.pensionFundName],
  );
  const arlSelectOptions = useMemo(
    () => buildCatalogSelectOptions(catalogsQuery.grouped.ARL ?? [], values?.arlName ?? ''),
    [catalogsQuery.grouped, values?.arlName],
  );
  const cajaSelectOptions = useMemo(
    () =>
      buildCatalogSelectOptions(
        catalogsQuery.grouped.CAJA_COMPENSACION ?? [],
        values?.cajaCompensacion ?? '',
      ),
    [catalogsQuery.grouped, values?.cajaCompensacion],
  );

  const catalogPlaceholder = (hasOptions: boolean) =>
    catalogSelectPlaceholder(
      catalogsQuery.isLoading,
      hasOptions,
      'Cargando opciones...',
      'No hay opciones configuradas',
      'Seleccionar',
      catalogsQuery.isError,
    );

  const updateField = <K extends keyof SocialSecurityFormValues>(
    key: K,
    value: SocialSecurityFormValues[K],
  ) => {
    setValues((current) => (current ? { ...current, [key]: value } : current));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleCancel = () => {
    if (employeeQuery.data) {
      setValues(toFormValues(employeeQuery.data));
    }
    setErrors({});
    setEditing(false);
  };

  const handleSubmit = async () => {
    if (!values) return;

    const nextErrors = validateForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const input: UpdatePayrollEmployeeInput = {
      epsName: values.epsName.trim(),
      pensionFundName: values.pensionFundName.trim(),
      arlName: values.arlName.trim(),
      arlRiskLevel: values.arlRiskLevel,
      cajaCompensacion: values.cajaCompensacion.trim(),
    };

    setSubmitting(true);
    try {
      await updateMutation.mutateAsync({ userId, input });
      toast.success('Afiliaciones actualizadas');
      setEditing(false);
      setErrors({});
    } catch (error) {
      const message =
        error instanceof PayrollApiError
          ? error.message
          : 'No se pudieron guardar las afiliaciones';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (employeeQuery.isLoading) {
    return <PayrollEmployeeProfileTabLoading />;
  }

  if (employeeQuery.isError || !employeeQuery.data || !values) {
    return (
      <div className={styles.state}>
        <p>No se pudieron cargar las afiliaciones.</p>
        <button type="button" onClick={() => void employeeQuery.refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Seguridad social</h2>
          <p className={styles.subtitle}>
            Afiliaciones a salud, pensión, ARL y caja de compensación del colaborador.
          </p>
        </div>
        {canEdit && !editing ? (
          <RecetaFormButton
            type="button"
            theme={theme}
            variant="add"
            label="Editar"
            onClick={() => setEditing(true)}
          />
        ) : null}
      </div>

      {!editing ? (
        <div className={styles.detailsGrid}>
          {affiliations.map((affiliation) => (
            <div key={affiliation.key} className={styles.field}>
              <div className={styles.fieldLabelRow}>
                <span className={styles.label}>{affiliation.label}</span>
                <StatusBadge status={affiliation.status} theme={theme} size="sm" variant="pill" />
              </div>
              <div className={styles.value}>{affiliation.entityName?.trim() || '—'}</div>
            </div>
          ))}

          {arlAffiliation?.extraValue ? (
            <div className={styles.field}>
              <span className={styles.label}>Nivel ARL</span>
              <div className={styles.value}>{arlAffiliation.extraValue}</div>
            </div>
          ) : null}

          <div className={styles.field}>
            <span className={styles.label}>Fecha de vinculación</span>
            <div className={styles.value}>{formatAffiliationDate(employeeQuery.data.hireDate)}</div>
          </div>
        </div>
      ) : (
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <div className={styles.grid}>
            <label className={styles.field}>
              <span className={styles.label}>Salud (EPS)</span>
              <RecetaFilterSelect
                aria-label="EPS"
                options={epsSelectOptions}
                value={values.epsName}
                disabled={catalogsQuery.isLoading || epsSelectOptions.length === 0}
                placeholder={catalogPlaceholder(epsSelectOptions.length > 0)}
                onChange={(value) => updateField('epsName', value)}
                theme={theme}
                size="md"
              />
              {errors.epsName ? <p className={styles.error}>{errors.epsName}</p> : null}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Pensión</span>
              <RecetaFilterSelect
                aria-label="Fondo de pensión"
                options={pensionSelectOptions}
                value={values.pensionFundName}
                disabled={catalogsQuery.isLoading || pensionSelectOptions.length === 0}
                placeholder={catalogPlaceholder(pensionSelectOptions.length > 0)}
                onChange={(value) => updateField('pensionFundName', value)}
                theme={theme}
                size="md"
              />
              {errors.pensionFundName ? (
                <p className={styles.error}>{errors.pensionFundName}</p>
              ) : null}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>ARL</span>
              <RecetaFilterSelect
                aria-label="ARL"
                options={arlSelectOptions}
                value={values.arlName}
                disabled={catalogsQuery.isLoading || arlSelectOptions.length === 0}
                placeholder={catalogPlaceholder(arlSelectOptions.length > 0)}
                onChange={(value) => updateField('arlName', value)}
                theme={theme}
                size="md"
              />
              {errors.arlName ? <p className={styles.error}>{errors.arlName}</p> : null}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Nivel ARL</span>
              <RecetaFilterSelect
                aria-label="Nivel ARL"
                options={ARL_LEVEL_OPTIONS}
                value={values.arlRiskLevel}
                onChange={(value) => updateField('arlRiskLevel', value as ArlRiskLevel)}
                theme={theme}
                size="md"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Caja de compensación</span>
              <RecetaFilterSelect
                aria-label="Caja de compensación"
                options={cajaSelectOptions}
                value={values.cajaCompensacion}
                disabled={catalogsQuery.isLoading || cajaSelectOptions.length === 0}
                placeholder={catalogPlaceholder(cajaSelectOptions.length > 0)}
                onChange={(value) => updateField('cajaCompensacion', value)}
                theme={theme}
                size="md"
              />
              {errors.cajaCompensacion ? (
                <p className={styles.error}>{errors.cajaCompensacion}</p>
              ) : null}
            </label>

            <div className={styles.field}>
              <span className={styles.label}>Fecha de vinculación</span>
              <p className={styles.readonlyValue}>
                {formatAffiliationDate(employeeQuery.data.hireDate)}
              </p>
              <p className={styles.hint}>
                La fecha de vinculación corresponde a la fecha de ingreso del colaborador.
              </p>
            </div>
          </div>

          <div className={styles.actions}>
            <RecetaFormButton
              type="button"
              theme={theme}
              variant="cancel"
              label="Cancelar"
              onClick={handleCancel}
            />
            <RecetaFormButton
              type="submit"
              theme={theme}
              variant="save"
              label={submitting ? 'Guardando…' : 'Guardar cambios'}
              disabled={submitting}
            />
          </div>
        </form>
      )}
    </div>
  );
}
