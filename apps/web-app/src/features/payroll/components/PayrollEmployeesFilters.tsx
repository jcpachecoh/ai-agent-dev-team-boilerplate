import { RecetaFilterSelect } from '@restopsiq/ui';

import { useUiTheme } from '@/hooks/useUiTheme';

import type { EmployeeContractType } from '../types/payroll.types';
import styles from '../payroll.module.scss';

interface PayrollEmployeesFiltersProps {
  search: string;
  locationId: string;
  contractType: EmployeeContractType | 'all';
  includeInactive: boolean;
  onSearchChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onContractTypeChange: (value: EmployeeContractType | 'all') => void;
  onIncludeInactiveChange: (value: boolean) => void;
}

const CONTRACT_TYPE_OPTIONS: Array<{ value: EmployeeContractType | 'all'; label: string }> = [
  { value: 'all', label: 'Todos los contratos' },
  { value: 'FIJO', label: 'Fijo' },
  { value: 'INDEFINIDO', label: 'Indefinido' },
  { value: 'OBRA', label: 'Obra o labor' },
  { value: 'PRESTACION', label: 'Prestacion de servicios' },
  { value: 'APRENDIZAJE', label: 'Aprendizaje' },
];

export function PayrollEmployeesFilters({
  search,
  locationId,
  contractType,
  includeInactive,
  onSearchChange,
  onLocationChange,
  onContractTypeChange,
  onIncludeInactiveChange,
}: PayrollEmployeesFiltersProps): React.JSX.Element {
  const theme = useUiTheme();

  return (
    <section className={styles.toolbar} aria-label="Filtros de empleados">
      <input
        className={styles.input}
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Buscar por nombre, cedula o email"
        aria-label="Buscar empleados"
      />
      <input
        className={styles.input}
        value={locationId}
        onChange={(event) => onLocationChange(event.target.value)}
        placeholder="Filtrar por locationId"
        aria-label="Filtrar por locationId"
      />
      <RecetaFilterSelect
        aria-label="Filtrar por tipo de contrato"
        options={CONTRACT_TYPE_OPTIONS}
        value={contractType}
        onChange={(value) => onContractTypeChange(value as EmployeeContractType | 'all')}
        theme={theme}
        size="md"
      />
      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={includeInactive}
          onChange={(event) => onIncludeInactiveChange(event.target.checked)}
        />
        Incluir inactivos
      </label>
    </section>
  );
}
