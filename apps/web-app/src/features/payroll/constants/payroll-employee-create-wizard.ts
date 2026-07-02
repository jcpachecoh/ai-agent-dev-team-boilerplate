export type PayrollEmployeeCreateWizardStepId = 'personal' | 'social-security' | 'banks' | 'taxes';

export const PAYROLL_EMPLOYEE_CREATE_WIZARD_STEPS: Array<{
  id: PayrollEmployeeCreateWizardStepId;
  label: string;
}> = [
  { id: 'personal', label: 'Datos personales' },
  { id: 'social-security', label: 'Seg. social' },
  { id: 'banks', label: 'Bancos' },
  { id: 'taxes', label: 'Impuestos' },
];

export function payrollEmployeeCreateWizardStepIndex(
  stepId: PayrollEmployeeCreateWizardStepId,
): number {
  return PAYROLL_EMPLOYEE_CREATE_WIZARD_STEPS.findIndex((step) => step.id === stepId);
}
