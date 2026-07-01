import { RecetaFilterSelect } from '@restopsiq/ui';
import { useMemo } from 'react';

import type { TenantApiModel } from '@/features/empresa/api/empresa.queries';
import { useTenant } from '@/features/empresa/hooks/useTenant';
import { useUiTheme } from '@/hooks/useUiTheme';

import { useLaborClassificationFilter } from '../stores/attendance-labor-filter.store';
import type { LaborClassificationFilterValue } from '../utils/labor-classification';
import styles from './AttendanceHeaderLaborFilter.module.scss';

const CLASSIFICATION_SUFFIX: Record<LaborClassificationFilterValue, string> = {
  all: 'Todos',
  administrativo: 'Administrativo',
  operaciones: 'Operaciones',
};

const LABOR_FILTER_OPTIONS: LaborClassificationFilterValue[] = [
  'all',
  'administrativo',
  'operaciones',
];

function resolveTenantLabel(tenant?: TenantApiModel): string {
  if (!tenant) return 'Empresa';
  return tenant.tradeName?.trim() || tenant.legalName?.trim() || tenant.name;
}

export function AttendanceHeaderLaborFilter(): React.JSX.Element {
  const theme = useUiTheme();
  const { data: tenant } = useTenant();
  const { value, setValue } = useLaborClassificationFilter();
  const tenantLabel = resolveTenantLabel(tenant);

  const options = useMemo(
    () =>
      LABOR_FILTER_OPTIONS.map((option) => ({
        value: option,
        label: `${tenantLabel} - ${CLASSIFICATION_SUFFIX[option]}`,
      })),
    [tenantLabel],
  );

  return (
    <RecetaFilterSelect
      className={styles.select}
      aria-label="Clasificación de mano de obra"
      placeholder="Buscar clasificación"
      options={options}
      value={value}
      onChange={(next) => setValue(next as LaborClassificationFilterValue)}
      theme={theme}
      size="sm"
    />
  );
}
