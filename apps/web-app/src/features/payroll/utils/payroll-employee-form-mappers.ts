import type {
  CreatePayrollEmployeeInput,
  PayrollEmployeeFormValues,
  UpdatePayrollEmployeeInput,
} from '../types/payroll.types';
import { buildEmployeeFullName } from './employee-name';

export function payrollEmployeeFormValuesToCreateInput(
  values: PayrollEmployeeFormValues,
): CreatePayrollEmployeeInput {
  return {
    cedula: values.cedula.trim(),
    documentType: values.documentType,
    email: values.email.trim(),
    roleId: values.roleId.trim(),
    locationId: values.locationId.trim(),
    name: buildEmployeeFullName(values),
    positionId: values.positionId.trim() || undefined,
    area: values.area.trim(),
    department: values.department.trim(),
    contractType: values.contractType,
    hireDate: values.hireDate,
    contractStart: values.contractStart,
    contractEnd: values.contractEnd.trim() || undefined,
    salaryType: values.salaryType,
    salaryAmount: Number(values.salaryAmount),
    epsName: values.epsName.trim(),
    pensionFundName: values.pensionFundName.trim(),
    cesantiasFundName: values.cesantiasFundName.trim(),
    arlName: values.arlName.trim(),
    arlRiskLevel: values.arlRiskLevel,
    cajaCompensacion: values.cajaCompensacion.trim(),
    barrio: values.barrio.trim() || undefined,
    localidad: values.localidad.trim() || undefined,
    costCenter: values.costCenter,
    laborClassification: values.laborClassification,
    nonSalaryAmount:
      values.nonSalaryAmount.trim() !== '' ? Number(values.nonSalaryAmount) : undefined,
    beneficiaries: values.beneficiaries.map((b) => ({
      fullName: b.fullName.trim(),
      relationshipType: b.relationshipType,
      age: Number(b.age),
    })),
  };
}

export function payrollEmployeeFormValuesToUpdateInput(
  values: PayrollEmployeeFormValues,
): UpdatePayrollEmployeeInput {
  return payrollEmployeeFormValuesToCreateInput(values);
}
