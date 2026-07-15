export type FinalSettlementWizardStepId = 'termination' | 'review' | 'approval';

export const FINAL_SETTLEMENT_WIZARD_STEPS: Array<{
  id: FinalSettlementWizardStepId;
  label: string;
}> = [
  { id: 'termination', label: 'Terminación' },
  { id: 'review', label: 'Cálculo' },
  { id: 'approval', label: 'Aprobación y pago' },
];
