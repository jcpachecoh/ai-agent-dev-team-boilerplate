import { useEffect, useState } from 'react';

import {
  type ArlRiskLevel,
  type DocumentType,
  type EmployeeContractType,
  type PayrollEmployee,
  type PayrollEmployeeFormValues,
  type SalaryType,
} from '../types/payroll.types';
import styles from '../payroll.module.scss';

export interface PayrollEmployeeFormProps {
  mode: 'create' | 'edit';
  initialValues?: PayrollEmployee;
  onCancel: () => void;
  onSubmit: (values: PayrollEmployeeFormValues) => void;
  submitting?: boolean;
}

const EMPTY_VALUES: PayrollEmployeeFormValues = {
  cedula: '',
  documentType: 'CC',
  email: '',
  password: '',
  roleId: '',
  locationId: '',
  name: '',
  position: '',
  area: '',
  department: '',
  contractType: 'INDEFINIDO',
  hireDate: '',
  contractStart: '',
  contractEnd: '',
  salaryType: 'ORDINARIO',
  salaryAmount: '',
  epsName: '',
  pensionFundName: '',
  cesantiasFundName: '',
  arlName: '',
  arlRiskLevel: 'RIESGO_I',
  cajaCompensacion: '',
};

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function employeeToFormValues(employee: PayrollEmployee): PayrollEmployeeFormValues {
  return {
    cedula: employee.user?.cedula ?? '',
    documentType: (employee.user?.documentType as DocumentType) ?? 'CC',
    email: employee.user?.email ?? '',
    password: '',
    roleId: '',
    locationId: employee.locationId,
    name: employee.name,
    position: employee.position,
    area: employee.area,
    department: employee.department,
    contractType: employee.contractType,
    hireDate: toDateInputValue(employee.hireDate),
    contractStart: toDateInputValue(employee.contractStart),
    contractEnd: toDateInputValue(employee.contractEnd),
    salaryType: employee.salaryType,
    salaryAmount: employee.salaryAmount,
    epsName: employee.epsName,
    pensionFundName: employee.pensionFundName,
    cesantiasFundName: employee.cesantiasFundName,
    arlName: employee.arlName,
    arlRiskLevel: employee.arlRiskLevel,
    cajaCompensacion: employee.cajaCompensacion,
  };
}

function labelForMode(mode: 'create' | 'edit'): string {
  return mode === 'create' ? 'Crear empleado' : 'Guardar cambios';
}

const CONTRACT_TYPES: EmployeeContractType[] = [
  'FIJO',
  'INDEFINIDO',
  'OBRA',
  'PRESTACION',
  'APRENDIZAJE',
];
const DOCUMENT_TYPES: DocumentType[] = ['CC', 'CE', 'NIT', 'PASSPORT'];
const SALARY_TYPES: SalaryType[] = ['ORDINARIO', 'INTEGRAL'];
const ARL_LEVELS: ArlRiskLevel[] = ['RIESGO_I', 'RIESGO_II', 'RIESGO_III', 'RIESGO_IV', 'RIESGO_V'];

export function PayrollEmployeeForm({
  mode,
  initialValues,
  onCancel,
  onSubmit,
  submitting = false,
}: PayrollEmployeeFormProps): React.JSX.Element {
  const [values, setValues] = useState<PayrollEmployeeFormValues>(
    initialValues ? employeeToFormValues(initialValues) : EMPTY_VALUES,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValues(initialValues ? employeeToFormValues(initialValues) : EMPTY_VALUES);
    setError(null);
  }, [initialValues]);

  const update = (patch: Partial<PayrollEmployeeFormValues>) =>
    setValues((prev) => ({ ...prev, ...patch }));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!values.name.trim() || !values.email.trim() || !values.cedula.trim()) {
      setError('Nombre, email y cedula son obligatorios.');
      return;
    }

    if (!values.locationId.trim() || !values.roleId.trim()) {
      setError('Location ID y Role ID son obligatorios.');
      return;
    }

    if (mode === 'create' && !values.password.trim()) {
      setError('La contrasena es obligatoria para crear.');
      return;
    }

    const salary = Number(values.salaryAmount);
    if (!Number.isFinite(salary) || salary <= 0) {
      setError('El salario debe ser un numero mayor que 0.');
      return;
    }

    setError(null);
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.modalBody}>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Nombre *</span>
            <input
              aria-label="Nombre"
              className={styles.input}
              value={values.name}
              onChange={(event) => update({ name: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Cedula *</span>
            <input
              aria-label="Cedula"
              className={styles.input}
              value={values.cedula}
              onChange={(event) => update({ cedula: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Email *</span>
            <input
              aria-label="Email"
              className={styles.input}
              type="email"
              value={values.email}
              onChange={(event) => update({ email: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Contrasena {mode === 'create' ? '*' : ''}</span>
            <input
              aria-label="Contrasena"
              className={styles.input}
              type="password"
              value={values.password}
              onChange={(event) => update({ password: event.target.value })}
              placeholder={mode === 'edit' ? 'Opcional al editar' : ''}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Document Type</span>
            <select
              className={styles.select}
              value={values.documentType}
              onChange={(event) => update({ documentType: event.target.value as DocumentType })}
            >
              {DOCUMENT_TYPES.map((documentType) => (
                <option key={documentType} value={documentType}>
                  {documentType}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Role ID *</span>
            <input
              aria-label="Role ID"
              className={styles.input}
              value={values.roleId}
              onChange={(event) => update({ roleId: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Location ID *</span>
            <input
              aria-label="Location ID"
              className={styles.input}
              value={values.locationId}
              onChange={(event) => update({ locationId: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Cargo</span>
            <input
              className={styles.input}
              value={values.position}
              onChange={(event) => update({ position: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Area</span>
            <input
              className={styles.input}
              value={values.area}
              onChange={(event) => update({ area: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Departamento</span>
            <input
              className={styles.input}
              value={values.department}
              onChange={(event) => update({ department: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Tipo de contrato</span>
            <select
              className={styles.select}
              value={values.contractType}
              onChange={(event) =>
                update({ contractType: event.target.value as EmployeeContractType })
              }
            >
              {CONTRACT_TYPES.map((contractType) => (
                <option key={contractType} value={contractType}>
                  {contractType}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Fecha ingreso</span>
            <input
              className={styles.input}
              type="date"
              value={values.hireDate}
              onChange={(event) => update({ hireDate: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Inicio contrato</span>
            <input
              className={styles.input}
              type="date"
              value={values.contractStart}
              onChange={(event) => update({ contractStart: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Fin contrato</span>
            <input
              className={styles.input}
              type="date"
              value={values.contractEnd}
              onChange={(event) => update({ contractEnd: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Tipo de salario</span>
            <select
              className={styles.select}
              value={values.salaryType}
              onChange={(event) => update({ salaryType: event.target.value as SalaryType })}
            >
              {SALARY_TYPES.map((salaryType) => (
                <option key={salaryType} value={salaryType}>
                  {salaryType}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Salario</span>
            <input
              aria-label="Salario"
              className={styles.input}
              type="number"
              min="0"
              value={values.salaryAmount}
              onChange={(event) => update({ salaryAmount: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>EPS</span>
            <input
              className={styles.input}
              value={values.epsName}
              onChange={(event) => update({ epsName: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Fondo pension</span>
            <input
              className={styles.input}
              value={values.pensionFundName}
              onChange={(event) => update({ pensionFundName: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Cesantias</span>
            <input
              className={styles.input}
              value={values.cesantiasFundName}
              onChange={(event) => update({ cesantiasFundName: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>ARL</span>
            <input
              className={styles.input}
              value={values.arlName}
              onChange={(event) => update({ arlName: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Nivel ARL</span>
            <select
              className={styles.select}
              value={values.arlRiskLevel}
              onChange={(event) => update({ arlRiskLevel: event.target.value as ArlRiskLevel })}
            >
              {ARL_LEVELS.map((arlRiskLevel) => (
                <option key={arlRiskLevel} value={arlRiskLevel}>
                  {arlRiskLevel}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Caja compensacion</span>
            <input
              className={styles.input}
              value={values.cajaCompensacion}
              onChange={(event) => update({ cajaCompensacion: event.target.value })}
            />
          </label>
        </div>
        {error ? <p className={styles.error}>{error}</p> : null}
        <p className={styles.formHint}>
          Los campos con * son obligatorios para crear y actualizar.
        </p>
      </div>
      <footer className={styles.modalFooter}>
        <button className={styles.buttonSecondary} type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className={styles.button} type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : labelForMode(mode)}
        </button>
      </footer>
    </form>
  );
}
