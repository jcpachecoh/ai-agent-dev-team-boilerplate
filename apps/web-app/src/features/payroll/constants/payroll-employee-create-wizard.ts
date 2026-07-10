export type PayrollEmployeeCreateWizardStepId =
  | 'personal'
  | 'social-security'
  | 'banks'
  | 'assets'
  | 'documents';

export const PAYROLL_EMPLOYEE_CREATE_WIZARD_STEPS: Array<{
  id: PayrollEmployeeCreateWizardStepId;
  label: string;
}> = [
  { id: 'personal', label: 'Datos personales' },
  { id: 'social-security', label: 'Seg. social' },
  { id: 'banks', label: 'Bancos' },
  { id: 'assets', label: 'Activos' },
  { id: 'documents', label: 'Documentos' },
];

export function payrollEmployeeCreateWizardStepIndex(
  stepId: PayrollEmployeeCreateWizardStepId,
): number {
  return PAYROLL_EMPLOYEE_CREATE_WIZARD_STEPS.findIndex((step) => step.id === stepId);
}
