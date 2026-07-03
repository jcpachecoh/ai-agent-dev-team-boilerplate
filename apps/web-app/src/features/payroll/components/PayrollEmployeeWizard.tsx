import { RecetaFormButton, RecetaWizardShell, type RecetaWizardStepItem } from '@restopsiq/ui';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  PAYROLL_EMPLOYEE_CREATE_WIZARD_STEPS,
  payrollEmployeeCreateWizardStepIndex,
  type PayrollEmployeeCreateWizardStepId,
} from '../constants/payroll-employee-create-wizard';
import { useEmployeePersonalDataQuery } from '../hooks/useEmployeePersonalDataQuery';
import { useEmployeePositions } from '../hooks/useEmployeePositions';
import { useEmployeeTaxInformationQuery } from '../hooks/useEmployeeTaxInformationQuery';
import type { PayrollEmployee, PayrollEmployeeFormValues } from '../types/payroll.types';
import type {
  PayrollEmployeeCreateBankDraft,
  PayrollEmployeeCreateWizardPayload,
} from '../types/payroll-employee-create-wizard.types';
import {
  validatePayrollEmployeeBankStep,
  validatePayrollEmployeePersonalStep,
  validatePayrollEmployeeSocialStep,
  validatePayrollEmployeeTaxStep,
} from '../utils/payroll-employee-create-wizard-validation';
import {
  mergePersonalDataIntoFormValues,
  payrollEmployeeToFormValues,
  taxInformationToWizardDraft,
} from '../utils/payroll-employee-wizard-form-values';
import { EmployeePhotoUploader } from './EmployeePhotoUploader';
import { PAYROLL_EMPLOYEE_FORM_EMPTY_VALUES, PayrollEmployeeForm } from './PayrollEmployeeForm';
import { PayrollEmployeeWizardBankStep } from './PayrollEmployeeWizardBankStep';
import { PayrollEmployeeWizardTaxStep } from './PayrollEmployeeWizardTaxStep';
import styles from './PayrollEmployeeCreateWizard.module.scss';

const EMPTY_BANK_DRAFT: PayrollEmployeeCreateBankDraft = {
  bankCode: '',
  accountType: 'SAVINGS',
  accountNumber: '',
};

const EMPTY_TAX_DRAFT = {
  taxId: '',
  taxRegime: 'ORDINARIO',
  withholdingApplicable: false,
  withholdingRatePercent: '',
};

const themeClasses: Record<'light' | 'dark', string> = {
  light: styles.themeLight,
  dark: styles.themeDark,
};

export type PayrollEmployeeWizardMode = 'create' | 'edit';

export interface PayrollEmployeeWizardProps {
  mode: PayrollEmployeeWizardMode;
  open: boolean;
  employee?: PayrollEmployee;
  submitting?: boolean;
  theme?: 'light' | 'dark';
  onClose: () => void;
  onSubmit: (payload: PayrollEmployeeCreateWizardPayload) => void;
}

export function PayrollEmployeeWizard({
  mode,
  open,
  employee,
  submitting = false,
  theme = 'dark',
  onClose,
  onSubmit,
}: PayrollEmployeeWizardProps): React.JSX.Element | null {
  const isEditMode = mode === 'edit';
  const positionsQuery = useEmployeePositions({ includeInactive: false });
  const hasActivePositions = (positionsQuery.data ?? []).some((position) => position.isActive);

  const personalDataQuery = useEmployeePersonalDataQuery(
    isEditMode && open ? employee?.userId : undefined,
  );
  const taxQuery = useEmployeeTaxInformationQuery(isEditMode && open ? employee?.id : undefined);

  const [currentStep, setCurrentStep] = useState<PayrollEmployeeCreateWizardStepId>('personal');
  const [maxReachedStep, setMaxReachedStep] =
    useState<PayrollEmployeeCreateWizardStepId>('personal');
  const [employeeValues, setEmployeeValues] = useState<PayrollEmployeeFormValues>(
    PAYROLL_EMPLOYEE_FORM_EMPTY_VALUES,
  );
  const [bankDraft, setBankDraft] = useState(EMPTY_BANK_DRAFT);
  const [taxDraft, setTaxDraft] = useState(EMPTY_TAX_DRAFT);
  const [bankErrors, setBankErrors] = useState<Partial<Record<string, string>>>({});
  const [taxErrors, setTaxErrors] = useState<Partial<Record<string, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null);

  const isLoadingEditData =
    isEditMode && open && Boolean(employee) && (personalDataQuery.isLoading || taxQuery.isLoading);

  useEffect(() => {
    if (!open) return;

    setCurrentStep('personal');
    setMaxReachedStep(isEditMode ? 'taxes' : 'personal');
    setBankDraft(EMPTY_BANK_DRAFT);
    setTaxDraft(EMPTY_TAX_DRAFT);
    setBankErrors({});
    setTaxErrors({});
    setError(null);
    setLocalPhotoUrl(null);

    if (isEditMode && employee) {
      const baseValues = payrollEmployeeToFormValues(employee);
      setEmployeeValues(
        personalDataQuery.data
          ? mergePersonalDataIntoFormValues(baseValues, personalDataQuery.data)
          : baseValues,
      );
      setTaxDraft(taxInformationToWizardDraft(taxQuery.data));
      return;
    }

    setEmployeeValues(PAYROLL_EMPLOYEE_FORM_EMPTY_VALUES);
  }, [employee, isEditMode, open, personalDataQuery.data, taxQuery.data]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, submitting]);

  const currentIndex = payrollEmployeeCreateWizardStepIndex(currentStep);
  const maxIndex = payrollEmployeeCreateWizardStepIndex(maxReachedStep);

  const steps = useMemo(
    () =>
      PAYROLL_EMPLOYEE_CREATE_WIZARD_STEPS.map((step, index) => ({
        ...step,
        status: isEditMode
          ? step.id === currentStep
            ? ('active' as const)
            : ('completed' as const)
          : step.id === currentStep
            ? ('active' as const)
            : index < currentIndex || (index <= maxIndex && index > currentIndex)
              ? ('completed' as const)
              : ('pending' as const),
      })) as unknown as RecetaWizardStepItem[],
    [currentIndex, currentStep, isEditMode, maxIndex],
  );

  const selectedPosition = (positionsQuery.data ?? []).find(
    (position) => position.id === employeeValues.positionId,
  );

  const validateForSubmit = (): string | null => {
    const personalError = validatePayrollEmployeePersonalStep(employeeValues, {
      hasActivePositions,
      selectedPositionArea: selectedPosition?.area,
    });
    if (personalError) return personalError;

    const socialError = validatePayrollEmployeeSocialStep(employeeValues);
    if (socialError) return socialError;

    const bankValidation = validatePayrollEmployeeBankStep(bankDraft);
    if (bankValidation.message) {
      setBankErrors(bankValidation.fieldErrors);
      return bankValidation.message;
    }
    setBankErrors({});

    const taxError = validatePayrollEmployeeTaxStep(taxDraft);
    if (taxError) {
      if (taxError.includes('NIT')) {
        setTaxErrors({ taxId: taxError });
      } else {
        setTaxErrors({ withholdingRatePercent: taxError });
      }
      return taxError;
    }
    setTaxErrors({});
    return null;
  };

  const validateCurrentStep = (): string | null => {
    if (currentStep === 'personal') {
      return validatePayrollEmployeePersonalStep(employeeValues, {
        hasActivePositions,
        selectedPositionArea: selectedPosition?.area,
      });
    }

    if (currentStep === 'social-security') {
      return validatePayrollEmployeeSocialStep(employeeValues);
    }

    if (currentStep === 'banks') {
      const bankValidation = validatePayrollEmployeeBankStep(bankDraft);
      if (bankValidation.message) {
        setBankErrors(bankValidation.fieldErrors);
        return bankValidation.message;
      }
      setBankErrors({});
      return null;
    }

    const taxError = validatePayrollEmployeeTaxStep(taxDraft);
    if (taxError) {
      if (taxError.includes('NIT')) {
        setTaxErrors({ taxId: taxError });
      } else {
        setTaxErrors({ withholdingRatePercent: taxError });
      }
      return taxError;
    }
    setTaxErrors({});
    return null;
  };

  const goToStep = (stepId: PayrollEmployeeCreateWizardStepId) => {
    setError(null);
    setCurrentStep(stepId);
  };

  const handleStepClick = (stepId: string) => {
    if (isEditMode) {
      goToStep(stepId as PayrollEmployeeCreateWizardStepId);
      return;
    }

    const targetIndex = payrollEmployeeCreateWizardStepIndex(
      stepId as PayrollEmployeeCreateWizardStepId,
    );
    if (targetIndex <= maxIndex) {
      goToStep(stepId as PayrollEmployeeCreateWizardStepId);
    }
  };

  const handleNext = () => {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const nextStep = PAYROLL_EMPLOYEE_CREATE_WIZARD_STEPS[currentIndex + 1];
    if (!nextStep) return;

    const nextIndex = payrollEmployeeCreateWizardStepIndex(nextStep.id);
    setCurrentStep(nextStep.id);
    if (nextIndex > maxIndex) {
      setMaxReachedStep(nextStep.id);
    }
  };

  const handlePrevious = () => {
    setError(null);
    const previousStep = PAYROLL_EMPLOYEE_CREATE_WIZARD_STEPS[currentIndex - 1];
    if (previousStep) {
      setCurrentStep(previousStep.id);
    }
  };

  const handleSave = () => {
    const validationError = validateForSubmit();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    const areaFromPosition = hasActivePositions
      ? (selectedPosition?.area?.trim() ?? '')
      : employeeValues.area;

    const payload: PayrollEmployeeCreateWizardPayload = {
      employee: {
        ...employeeValues,
        area: areaFromPosition,
      },
    };

    if (bankDraft.bankCode.trim() && bankDraft.accountNumber.trim()) {
      payload.bankAccount = {
        ...bankDraft,
        accountNumber: bankDraft.accountNumber.replace(/\D/g, ''),
      };
    }

    if (taxDraft.taxId.trim()) {
      payload.taxInformation = {
        ...taxDraft,
        taxId: taxDraft.taxId.trim(),
      };
    }

    onSubmit(payload);
  };

  if (!open || (isEditMode && !employee)) {
    return null;
  }

  const employeeWithPhoto: PayrollEmployee =
    localPhotoUrl && employee ? { ...employee, photoUrl: localPhotoUrl } : employee!;

  const isLastStep = currentStep === 'taxes';
  const isFirstStep = currentStep === 'personal';
  const saveLabel = isEditMode ? 'Guardar' : 'Crear empleado';

  const footer = (
    <div className={styles.footerActions}>
      {isFirstStep ? (
        <RecetaFormButton variant="cancel" theme={theme} label="Cancelar" onClick={onClose} />
      ) : (
        <RecetaFormButton
          variant="cancel"
          theme={theme}
          label="Anterior"
          icon={<ArrowLeft aria-hidden />}
          onClick={handlePrevious}
          disabled={submitting || isLoadingEditData}
        />
      )}

      <div className={styles.footerRightActions}>
        {isEditMode || isLastStep ? (
          <RecetaFormButton
            className={styles.footerActionButton}
            variant="save"
            theme={theme}
            label={submitting ? 'Guardando...' : saveLabel}
            disabled={submitting || isLoadingEditData}
            onClick={handleSave}
          />
        ) : null}

        {!isLastStep ? (
          <RecetaFormButton
            className={styles.footerActionButton}
            variant="add"
            theme={theme}
            label="Siguiente"
            icon={<ArrowRight aria-hidden />}
            disabled={submitting || isLoadingEditData}
            onClick={handleNext}
          />
        ) : null}
      </div>
    </div>
  );

  const handleBackdropClick = () => {
    if (!submitting) onClose();
  };

  const handleDialogClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick} role="presentation">
      <div
        className={[styles.dialog, themeClasses[theme]].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payroll-employee-wizard-title"
        onClick={handleDialogClick}
      >
        <RecetaWizardShell
          className={styles.wizard}
          variant="modal"
          theme={theme}
          title={isEditMode ? 'Editar empleado' : 'Nuevo empleado'}
          subtitle={isEditMode ? employee?.name : 'Registro por pasos'}
          steps={steps}
          activeStepId={currentStep}
          onStepClick={handleStepClick}
          onClose={submitting ? undefined : onClose}
          error={error}
          loading={isLoadingEditData}
          loadingMessage="Cargando datos del empleado..."
          footer={footer}
        >
          <div className={styles.stepContent}>
            {currentStep === 'personal' || currentStep === 'social-security' ? (
              <>
                {isEditMode && currentStep === 'personal' ? (
                  <div className={styles.photoRow}>
                    <EmployeePhotoUploader
                      employee={employeeWithPhoto}
                      onPhotoUpdated={setLocalPhotoUrl}
                    />
                  </div>
                ) : null}
                <PayrollEmployeeForm
                  mode={isEditMode ? 'edit' : 'create'}
                  layout="wizard"
                  wizardStep={currentStep}
                  hideFooter
                  initialValues={isEditMode ? employee : undefined}
                  controlledValues={employeeValues}
                  onControlledValuesChange={setEmployeeValues}
                  onCancel={onClose}
                  onSubmit={() => undefined}
                  submitting={submitting}
                />
              </>
            ) : null}

            {currentStep === 'banks' ? (
              <PayrollEmployeeWizardBankStep
                theme={theme}
                values={bankDraft}
                errors={bankErrors}
                onChange={(nextValues) => {
                  setBankDraft(nextValues);
                  setBankErrors({});
                  setError(null);
                }}
              />
            ) : null}

            {currentStep === 'taxes' ? (
              <PayrollEmployeeWizardTaxStep
                theme={theme}
                values={taxDraft}
                errors={taxErrors}
                hint={
                  isEditMode && taxQuery.data
                    ? 'El NIT/RUT registrado termina en los dígitos visibles del perfil. Déjalo vacío para conservar el actual o ingresa uno nuevo para actualizar.'
                    : undefined
                }
                onChange={(nextValues) => {
                  setTaxDraft(nextValues);
                  setTaxErrors({});
                  setError(null);
                }}
              />
            ) : null}
          </div>
        </RecetaWizardShell>
      </div>
    </div>
  );
}
