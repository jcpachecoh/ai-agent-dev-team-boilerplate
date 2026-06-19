export type RecetaRecipeWizardStepId = 'general' | 'phases' | 'review';

export type RecetaWizardStepStatus = 'pending' | 'active' | 'completed';

export interface RecetaWizardStepItem {
  id: RecetaRecipeWizardStepId;
  label: string;
  status?: RecetaWizardStepStatus;
}

export interface RecetaWizardSelectOption {
  value: string;
  label: string;
}
