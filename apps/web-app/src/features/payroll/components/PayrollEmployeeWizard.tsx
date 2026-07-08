import { RecetaFormButton, RecetaWizardShell, type RecetaWizardStepItem } from '@restopsiq/ui';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  PAYROLL_EMPLOYEE_CREATE_WIZARD_STEPS,
  payrollEmployeeCreateWizardStepIndex,
  type PayrollEmployeeCreateWizardStepId,
} from '../constants/payroll-employee-create-wizard';
import { useEmployeeBankAccountsQuery } from '../hooks/useEmployeeBankAccountsQuery';
import { useEmployeePersonalDataQuery } from '../hooks/useEmployeePersonalDataQuery';
import { useEmployeePositions } from '../hooks/useEmployeePositions';
import { useEmployeeTaxInformationQuery } from '../hooks/useEmployeeTaxInformationQuery';
import type { PayrollEmployee, PayrollEmployeeFormValues } from '../types/payroll.types';
import type {
  PayrollEmployeeCreateBankDraft,
  PayrollEmployeeCreateWizardPayload,
} from '../types/payroll-employee-create-wizard.types';
import type { EmployeeAssetDraft } from '../types/employee-asset.types';
import {
  resolveBankDraftPayload,
  validatePayrollEmployeeBankStep,
  validatePayrollEmployeePersonalStep,
  validatePayrollEmployeeSocialStep,
  validatePayrollEmployeeTaxStep,
} from '../utils/payroll-employee-create-wizard-validation';
import {
  bankAccountToWizardDraft,
  mergePersonalDataIntoFormValues,
  payrollEmployeeToFormValues,
  taxInformationToWizardDraft,
} from '../utils/payroll-employee-wizard-form-values';
import { EmployeePhotoUploader } from './EmployeePhotoUploader';
import { PAYROLL_EMPLOYEE_FORM_EMPTY_VALUES, PayrollEmployeeForm } from './PayrollEmployeeForm';
import { PayrollEmployeeDocumentsTab } from './PayrollEmployeeDocumentsTab';
import { PayrollEmployeeWizardAssetsStep } from './PayrollEmployeeWizardAssetsStep';
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
  const bankAccountsQuery = useEmployeeBankAccountsQuery(
    isEditMode && open ? employee?.id : undefined,
  );

  const [currentStep, setCurrentStep] = useState<PayrollEmployeeCreateWizardStepId>('personal');
  const [maxReachedStep, setMaxReachedStep] =
    useState<PayrollEmployeeCreateWizardStepId>('personal');
  const [employeeValues, setEmployeeValues] = useState<PayrollEmployeeFormValues>(
    PAYROLL_EMPLOYEE_FORM_EMPTY_VALUES,
  );
  const [bankDraft, setBankDraft] = useState(EMPTY_BANK_DRAFT);
  const [taxDraft, setTaxDraft] = useState(EMPTY_TAX_DRAFT);
  const [assetDrafts, setAssetDrafts] = useState<EmployeeAssetDraft[]>([]);
  const [bankErrors, setBankErrors] = useState<Partial<Record<string, string>>>({});
  const [taxErrors, setTaxErrors] = useState<Partial<Record<string, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null);
  const initialBankDraftRef = useRef<PayrollEmployeeCreateBankDraft>(EMPTY_BANK_DRAFT);

  const isLoadingEditData =
    isEditMode &&
    open &&
    Boolean(employee) &&
    (personalDataQuery.isLoading || taxQuery.isLoading || bankAccountsQuery.isLoading);

  useEffect(() => {
    if (!open) return;

    setCurrentStep('personal');
    setMaxReachedStep(isEditMode ? 'documents' : 'personal');
    setBankDraft(EMPTY_BANK_DRAFT);
    setTaxDraft(EMPTY_TAX_DRAFT);
    setAssetDrafts([]);
    setBankErrors({});
    setTaxErrors({});
    setError(null);
    setLocalPhotoUrl(null);
    initialBankDraftRef.current = EMPTY_BANK_DRAFT;

    if (isEditMode && employee) {
      const baseValues = payrollEmployeeToFormValues(employee);
      setEmployeeValues(
        personalDataQuery.data
          ? mergePersonalDataIntoFormValues(baseValues, personalDataQuery.data)
          : baseValues,
      );
      setTaxDraft(taxInformationToWizardDraft(taxQuery.data));
      const loadedBankDraft = bankAccountToWizardDraft(bankAccountsQuery.data);
      setBankDraft(loadedBankDraft);
      initialBankDraftRef.current = loadedBankDraft;
      return;
    }

    setEmployeeValues(PAYROLL_EMPLOYEE_FORM_EMPTY_VALUES);
  }, [employee, isEditMode, open, personalDataQuery.data, taxQuery.data, bankAccountsQuery.data]);

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

  const visibleSteps = isEditMode
    ? PAYROLL_EMPLOYEE_CREATE_WIZARD_STEPS
    : PAYROLL_EMPLOYEE_CREATE_WIZARD_STEPS.filter((s) => s.id !== 'documents');

  const currentIndex = visibleSteps.findIndex((s) => s.id === currentStep);
  const maxIndex = visibleSteps.findIndex((s) => s.id === maxReachedStep);

  const steps = useMemo(
    () =>
      visibleSteps.map((step, index) => ({
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIndex, currentStep, isEditMode, maxIndex],
  );

  const selectedPosition = (positionsQuery.data ?? []).find(
    (position) => position.id === employeeValues.positionId,
  );

  const validateForSubmit = (): {
    stepId: PayrollEmployeeCreateWizardStepId;
    message: string;
  } | null => {
    const personalError = validatePayrollEmployeePersonalStep(employeeValues, {
      hasActivePositions,
      selectedPositionArea: selectedPosition?.area,
    });
    if (personalError) return { stepId: 'personal', message: personalError };

    const socialError = validatePayrollEmployeeSocialStep(employeeValues);
    if (socialError) return { stepId: 'social-security', message: socialError };

    const bankValidation = validatePayrollEmployeeBankStep(bankDraft);
    if (bankValidation.message) {
      setBankErrors(bankValidation.fieldErrors);
      return { stepId: 'banks', message: bankValidation.message };
    }
    setBankErrors({});

    const taxError = validatePayrollEmployeeTaxStep(taxDraft);
    if (taxError) {
      if (taxError.includes('NIT')) {
        setTaxErrors({ taxId: taxError });
      } else {
        setTaxErrors({ withholdingRatePercent: taxError });
      }
      return { stepId: 'taxes', message: taxError };
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

    if (currentStep === 'taxes') {
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
    }

    // assets step is optional — no validation
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

    const targetIndex = visibleSteps.findIndex((s) => s.id === stepId);
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
    const nextStep = visibleSteps[currentIndex + 1];
    if (!nextStep) return;

    const nextIndex = visibleSteps.findIndex((s) => s.id === nextStep.id);
    setCurrentStep(nextStep.id);
    if (nextIndex > maxIndex) {
      setMaxReachedStep(nextStep.id);
    }
  };

  const handlePrevious = () => {
    setError(null);
    const previousStep = visibleSteps[currentIndex - 1];
    if (previousStep) {
      setCurrentStep(previousStep.id);
    }
  };

  const handleSave = () => {
    const validation = validateForSubmit();
    if (validation) {
      if (validation.stepId !== currentStep) {
        const targetIndex = visibleSteps.findIndex((s) => s.id === validation.stepId);
        if (targetIndex > maxIndex) {
          setMaxReachedStep(validation.stepId);
        }
        setCurrentStep(validation.stepId);
      }
      setError(validation.message);
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

    const bankAccountPayload = resolveBankDraftPayload(bankDraft, initialBankDraftRef.current);
    if (bankAccountPayload) {
      payload.bankAccount = bankAccountPayload;
    }

    if (taxDraft.taxId.trim()) {
      payload.taxInformation = {
        ...taxDraft,
        taxId: taxDraft.taxId.trim(),
      };
    }

    const validDrafts = assetDrafts.filter((d) => d.assetName.trim() && d.type && d.value.trim());
    if (validDrafts.length > 0) {
      payload.assetDrafts = validDrafts;
    }

    onSubmit(payload);
  };

  if (!open || (isEditMode && !employee)) {
    return null;
  }

  const employeeWithPhoto: PayrollEmployee =
    localPhotoUrl && employee ? { ...employee, photoUrl: localPhotoUrl } : employee!;

  const isLastStep = currentStep === 'documents';
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
                hint={
                  isEditMode && bankDraft.bankAccountId
                    ? 'Ya existe una cuenta registrada. Haz clic en el número para reemplazarla o ajusta banco/tipo de cuenta.'
                    : undefined
                }
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

            {currentStep === 'assets' ? (
              <PayrollEmployeeWizardAssetsStep
                theme={theme}
                drafts={assetDrafts}
                onChange={setAssetDrafts}
              />
            ) : null}

            {currentStep === 'documents' && employee?.userId ? (
              <PayrollEmployeeDocumentsTab userId={employee.userId} theme={theme} />
            ) : null}
          </div>
        </RecetaWizardShell>
      </div>
    </div>
  );
}
