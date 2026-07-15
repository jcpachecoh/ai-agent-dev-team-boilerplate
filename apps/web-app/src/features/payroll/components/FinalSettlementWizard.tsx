import {
  LoadingState,
  RecetaFormButton,
  RecetaWizardShell,
  toast,
  type RecetaWizardStepItem,
} from '@restopsiq/ui';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  canApproveFinalSettlement,
  canCalculateFinalSettlement,
  canCreateManualFinalSettlement,
  canPayFinalSettlement,
  canReconcilePendingSalary,
  canValidateLegalFormula,
  canVoidFinalSettlement,
} from '@/config/rbac.config';
import { useMe } from '@/features/auth/hooks/useMe';
import { getRoleCodeFromToken } from '@/lib/auth-token';

import { FinalSettlementManualModal } from './FinalSettlementManualModal';
import { FinalSettlementPayModal } from './FinalSettlementPayModal';
import { FinalSettlementVoidModal } from './FinalSettlementVoidModal';
import styles from './FinalSettlementWizard.module.scss';
import { FinalSettlementWizardApprovalStep } from './FinalSettlementWizardApprovalStep';
import { FinalSettlementWizardReviewStep } from './FinalSettlementWizardReviewStep';
import { FinalSettlementWizardTerminationStep } from './FinalSettlementWizardTerminationStep';
import { LegalFormulaValidationModal } from './LegalFormulaValidationModal';
import { PendingSalaryReconciliationModal } from './PendingSalaryReconciliationModal';
import { PayrollApiError } from '../api/payroll.client';
import {
  FINAL_SETTLEMENT_WIZARD_STEPS,
  type FinalSettlementWizardStepId,
} from '../constants/final-settlement-wizard';
import {
  useApproveFinalSettlementMutation,
  useCalculateFinalSettlementMutation,
  useCreateManualFinalSettlementMutation,
  useMarkFinalSettlementPaidMutation,
  usePreviewFinalSettlementMutation,
  useReconcilePendingSalaryMutation,
  useRecalculateFinalSettlementMutation,
  useValidateLegalFormulaMutation,
  useVoidFinalSettlementMutation,
} from '../hooks/useFinalSettlementMutations';
import {
  useActiveLegalFormulaValidationQuery,
  useFinalSettlementQuery,
  useFinalSettlementsByEmployeeQuery,
  usePendingSalaryReconciliationQuery,
} from '../hooks/useFinalSettlementQueries';
import { useFinalSettlementReceiptDownload } from '../hooks/useFinalSettlementReceiptDownload';
import type {
  ContractTerminationReason,
  CreateManualFinalSettlementInput,
  MarkFinalSettlementPaidInput,
  PreviewFinalSettlementInput,
  ReconcilePendingSalaryInput,
  SettlementPreviewResult,
  ValidateLegalFormulaInput,
  VoidFinalSettlementInput,
} from '../types/final-settlement.types';
import type { PayrollEmployee } from '../types/payroll.types';

const themeClasses: Record<'light' | 'dark', string> = {
  light: styles.themeLight,
  dark: styles.themeDark,
};

export interface FinalSettlementTerminationFormValues {
  effectiveTerminationDate: string;
  terminationReason: ContractTerminationReason | '';
  estimatedRemainingDays: string;
  estimatedRemainingDaysJustification: string;
}

const EMPTY_TERMINATION_VALUES: FinalSettlementTerminationFormValues = {
  effectiveTerminationDate: '',
  terminationReason: '',
  estimatedRemainingDays: '',
  estimatedRemainingDaysJustification: '',
};

interface Props {
  employee: PayrollEmployee;
  open: boolean;
  theme?: 'light' | 'dark';
  onClose: () => void;
  /** Notifica al aprobar (el contrato activo del empleado queda terminado) — permite que la
   * pantalla que embebe el wizard invalide sus propias queries fuera de `payrollKeys`
   * (p.ej. `attendanceKeys.collaborators` en `AttendanceCollaboratorsScreen`) sin acoplar
   * este componente a los query keys de otro feature. */
  onApproved?: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof PayrollApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocurrió un error inesperado.';
}

/**
 * OS-591 (fase 4) — extiende el flujo de desactivación de empleado con el workflow de
 * liquidación definitiva: terminación → cálculo (automático o manual) → aprobación → pago.
 * Nunca recalcula montos en el cliente; muestra `lines`/`warnings`/`blocks` tal cual los
 * devuelve el backend. Aprobar termina el contrato activo del empleado como efecto lateral
 * del backend (no de este componente) — el listado de empleados se invalida automáticamente.
 */
export function FinalSettlementWizard({
  employee,
  open,
  theme = 'dark',
  onClose,
  onApproved,
}: Props): React.JSX.Element | null {
  const { data: me } = useMe();
  const roleCode = me?.roleCode ?? getRoleCodeFromToken();

  const permissions = useMemo(
    () => ({
      canCalculate: canCalculateFinalSettlement(roleCode),
      canManual: canCreateManualFinalSettlement(roleCode),
      canReconcile: canReconcilePendingSalary(roleCode),
      canApprove: canApproveFinalSettlement(roleCode),
      canPay: canPayFinalSettlement(roleCode),
      canVoid: canVoidFinalSettlement(roleCode),
      canValidateLegalFormula: canValidateLegalFormula(roleCode),
    }),
    [roleCode],
  );

  const [currentStep, setCurrentStep] = useState<FinalSettlementWizardStepId>('termination');
  const [maxReachedStep, setMaxReachedStep] = useState<FinalSettlementWizardStepId>('termination');
  const [mode, setMode] = useState<'AUTOMATIC' | 'MANUAL'>('AUTOMATIC');
  const [terminationValues, setTerminationValues] =
    useState<FinalSettlementTerminationFormValues>(EMPTY_TERMINATION_VALUES);
  const [preview, setPreview] = useState<SettlementPreviewResult | null>(null);
  const [settlementId, setSettlementId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [reconciliationModalOpen, setReconciliationModalOpen] = useState(false);
  const [legalValidationModalOpen, setLegalValidationModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const resumedRef = useRef(false);

  const existingSettlementsQuery = useFinalSettlementsByEmployeeQuery(
    open ? employee.id : undefined,
  );
  const settlementQuery = useFinalSettlementQuery(settlementId ?? undefined);
  const settlement = settlementQuery.data;

  const previewMutation = usePreviewFinalSettlementMutation();
  const calculateMutation = useCalculateFinalSettlementMutation();
  const manualMutation = useCreateManualFinalSettlementMutation();
  const recalculateMutation = useRecalculateFinalSettlementMutation();
  const approveMutation = useApproveFinalSettlementMutation();
  const payMutation = useMarkFinalSettlementPaidMutation();
  const voidMutation = useVoidFinalSettlementMutation();
  const reconcileMutation = useReconcilePendingSalaryMutation();
  const validateFormulaMutation = useValidateLegalFormulaMutation();
  const receiptDownload = useFinalSettlementReceiptDownload();

  const needsLegalValidation = Boolean(
    settlement?.mode === 'AUTOMATIC' &&
    settlement.lines.some((line) => line.code === 'INDEMNIZACION'),
  );
  const needsReconciliation = Boolean(
    settlement?.lines.some((line) => line.code === 'SAL_PENDIENTE'),
  );

  const legalValidationQuery = useActiveLegalFormulaValidationQuery(
    needsLegalValidation ? settlement?.snapshotFormulaVersion : undefined,
  );
  const reconciliationQuery = usePendingSalaryReconciliationQuery(
    needsReconciliation ? settlement?.id : undefined,
  );

  useEffect(() => {
    // Cierra cualquier modal secundario que hubiera quedado abierto encima del wizard (p.ej.
    // el usuario cerró el wizard con un modal de anulación/pago abierto) — evita que
    // reaparezca con un `settlementId` obsoleto al reabrir para el mismo u otro empleado.
    setManualModalOpen(false);
    setReconciliationModalOpen(false);
    setLegalValidationModalOpen(false);
    setPayModalOpen(false);
    setVoidModalOpen(false);
    // Siempre, no solo al cerrar — si `employee.id` cambiara con `open` ya en true, la
    // liquidación resumida del empleado anterior no debe bloquear el intento de resumir la
    // del nuevo (ver segundo useEffect, que depende de este flag).
    resumedRef.current = false;

    if (!open) {
      return;
    }
    setError(null);
    setMode('AUTOMATIC');
    setTerminationValues(EMPTY_TERMINATION_VALUES);
    setPreview(null);
    setSettlementId(null);
    setCurrentStep('termination');
    setMaxReachedStep('termination');
  }, [open, employee.id]);

  // Retoma una liquidación activa existente (evita duplicar y chocar con el 409 del
  // backend cuando ya hay una liquidación en curso para el contrato activo).
  useEffect(() => {
    if (!open || resumedRef.current || !existingSettlementsQuery.data) {
      return;
    }
    resumedRef.current = true;
    const active = [...existingSettlementsQuery.data]
      .filter((item) => item.status !== 'VOIDED')
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
    if (active) {
      setSettlementId(active.id);
      setMode(active.mode);
      setCurrentStep('approval');
      setMaxReachedStep('approval');
    }
  }, [open, existingSettlementsQuery.data]);

  const advanceMax = (stepId: FinalSettlementWizardStepId): void => {
    const stepIndex = FINAL_SETTLEMENT_WIZARD_STEPS.findIndex((step) => step.id === stepId);
    const maxIndex = FINAL_SETTLEMENT_WIZARD_STEPS.findIndex((step) => step.id === maxReachedStep);
    if (stepIndex > maxIndex) {
      setMaxReachedStep(stepId);
    }
  };

  const buildPreviewInput = (): PreviewFinalSettlementInput => ({
    employeeDetailsId: employee.id,
    effectiveTerminationDate: terminationValues.effectiveTerminationDate,
    terminationReason: terminationValues.terminationReason as ContractTerminationReason,
    estimatedRemainingDays: terminationValues.estimatedRemainingDays
      ? Number(terminationValues.estimatedRemainingDays)
      : undefined,
    estimatedRemainingDaysJustification:
      terminationValues.estimatedRemainingDaysJustification.trim() || undefined,
  });

  const validateTerminationStep = (): string | null => {
    if (!terminationValues.effectiveTerminationDate) {
      return 'Selecciona la fecha efectiva de terminación';
    }
    if (!terminationValues.terminationReason) {
      return 'Selecciona la causal de terminación';
    }
    if (
      employee.contractType === 'OBRA' &&
      terminationValues.estimatedRemainingDays &&
      !terminationValues.estimatedRemainingDaysJustification.trim()
    ) {
      return 'La justificación es obligatoria cuando se estiman días restantes (OBRA/LABOR)';
    }
    return null;
  };

  const handleNextFromTermination = async (): Promise<void> => {
    const validationError = validateTerminationStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    if (mode === 'MANUAL') {
      setCurrentStep('review');
      advanceMax('review');
      return;
    }

    try {
      const result = await previewMutation.mutateAsync(buildPreviewInput());
      setPreview(result);
      setCurrentStep('review');
      advanceMax('review');
    } catch (previewError) {
      setError(getErrorMessage(previewError));
    }
  };

  const handleCalculate = async (): Promise<void> => {
    setError(null);
    try {
      const result = await calculateMutation.mutateAsync({
        ...buildPreviewInput(),
        mode: 'AUTOMATIC',
      });
      setSettlementId(result.id);
      setCurrentStep('approval');
      advanceMax('approval');
    } catch (calculateError) {
      setError(getErrorMessage(calculateError));
    }
  };

  const handleManualSubmit = async (
    partial: Omit<
      CreateManualFinalSettlementInput,
      'employeeDetailsId' | 'effectiveTerminationDate' | 'terminationReason'
    >,
  ): Promise<void> => {
    const result = await manualMutation.mutateAsync({
      employeeDetailsId: employee.id,
      effectiveTerminationDate: terminationValues.effectiveTerminationDate,
      terminationReason: terminationValues.terminationReason as ContractTerminationReason,
      ...partial,
    });
    setSettlementId(result.id);
    setCurrentStep('approval');
    advanceMax('approval');
  };

  const handleApprove = async (): Promise<void> => {
    if (!settlementId) {
      return;
    }
    setError(null);
    try {
      await approveMutation.mutateAsync(settlementId);
      toast.success('Liquidación aprobada — el contrato activo quedó terminado');
      onApproved?.();
    } catch (approveError) {
      setError(getErrorMessage(approveError));
    }
  };

  const handleRecalculate = async (): Promise<void> => {
    if (!settlementId) {
      return;
    }
    setError(null);
    try {
      await recalculateMutation.mutateAsync(settlementId);
      toast.success('Liquidación recalculada');
    } catch (recalculateError) {
      setError(getErrorMessage(recalculateError));
    }
  };

  const handlePay = async (input: MarkFinalSettlementPaidInput): Promise<void> => {
    if (!settlementId) {
      throw new Error('No hay liquidación activa');
    }
    await payMutation.mutateAsync({ id: settlementId, input });
  };

  const handleVoid = async (input: VoidFinalSettlementInput): Promise<void> => {
    if (!settlementId) {
      throw new Error('No hay liquidación activa');
    }
    await voidMutation.mutateAsync({ id: settlementId, input });
  };

  const handleReconcile = async (input: ReconcilePendingSalaryInput): Promise<void> => {
    if (!settlementId) {
      throw new Error('No hay liquidación activa');
    }
    await reconcileMutation.mutateAsync({ id: settlementId, input });
  };

  const handleValidateFormula = async (input: ValidateLegalFormulaInput): Promise<void> => {
    await validateFormulaMutation.mutateAsync(input);
  };

  const currentIndex = FINAL_SETTLEMENT_WIZARD_STEPS.findIndex((step) => step.id === currentStep);
  const maxIndex = FINAL_SETTLEMENT_WIZARD_STEPS.findIndex((step) => step.id === maxReachedStep);

  const steps = useMemo(
    () =>
      FINAL_SETTLEMENT_WIZARD_STEPS.map((step, index) => ({
        ...step,
        status:
          step.id === currentStep
            ? ('active' as const)
            : index < currentIndex || (index <= maxIndex && index > currentIndex)
              ? ('completed' as const)
              : ('pending' as const),
      })) as unknown as RecetaWizardStepItem[],
    [currentIndex, currentStep, maxIndex],
  );

  const handleStepClick = (stepId: string): void => {
    // Una vez persistida la liquidación, retroceder crearía otra sobre el mismo contrato
    // (409 del backend) — el stepper queda solo informativo desde ese punto.
    if (settlementId) {
      return;
    }
    const targetIndex = FINAL_SETTLEMENT_WIZARD_STEPS.findIndex((step) => step.id === stepId);
    if (targetIndex <= maxIndex) {
      setError(null);
      setCurrentStep(stepId as FinalSettlementWizardStepId);
    }
  };

  const handlePrevious = (): void => {
    if (settlementId) {
      return;
    }
    setError(null);
    const previousStep = FINAL_SETTLEMENT_WIZARD_STEPS[currentIndex - 1];
    if (previousStep) {
      setCurrentStep(previousStep.id);
    }
  };

  if (!open) {
    return null;
  }

  const busy =
    previewMutation.isPending ||
    calculateMutation.isPending ||
    manualMutation.isPending ||
    recalculateMutation.isPending ||
    approveMutation.isPending ||
    payMutation.isPending ||
    voidMutation.isPending;

  const isFirstStep = currentStep === 'termination';
  const canGoNextFromReview =
    mode === 'AUTOMATIC' &&
    Boolean(preview) &&
    preview!.blocks.length === 0 &&
    permissions.canCalculate;

  const footer = (
    <div className={styles.footerActions}>
      {isFirstStep || settlementId ? (
        <RecetaFormButton variant="cancel" theme={theme} label="Cerrar" onClick={onClose} />
      ) : (
        <RecetaFormButton
          variant="cancel"
          theme={theme}
          label="Anterior"
          icon={<ArrowLeft aria-hidden />}
          onClick={handlePrevious}
          disabled={busy}
        />
      )}

      <div className={styles.footerRightActions}>
        {currentStep === 'termination' ? (
          <RecetaFormButton
            variant="add"
            theme={theme}
            label={previewMutation.isPending ? 'Calculando…' : 'Siguiente'}
            icon={<ArrowRight aria-hidden />}
            disabled={busy || (mode === 'MANUAL' && !permissions.canManual)}
            onClick={() => void handleNextFromTermination()}
          />
        ) : null}

        {currentStep === 'review' && mode === 'AUTOMATIC' ? (
          <RecetaFormButton
            variant="save"
            theme={theme}
            label={calculateMutation.isPending ? 'Guardando…' : 'Calcular y guardar'}
            disabled={busy || !canGoNextFromReview}
            onClick={() => void handleCalculate()}
          />
        ) : null}

        {currentStep === 'review' && mode === 'MANUAL' ? (
          <RecetaFormButton
            variant="save"
            theme={theme}
            label="Abrir liquidación manual"
            disabled={busy || !permissions.canManual}
            onClick={() => setManualModalOpen(true)}
          />
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      <div className={styles.backdrop} role="presentation">
        <div
          className={[styles.dialog, themeClasses[theme]].filter(Boolean).join(' ')}
          role="dialog"
          aria-modal="true"
        >
          <RecetaWizardShell
            className={styles.wizard}
            variant="modal"
            theme={theme}
            title="Liquidación definitiva"
            subtitle={employee.name}
            steps={steps}
            activeStepId={currentStep}
            onStepClick={handleStepClick}
            onClose={busy ? undefined : onClose}
            error={error}
            loading={existingSettlementsQuery.isLoading && !resumedRef.current}
            loadingMessage="Consultando liquidaciones existentes…"
            footer={footer}
          >
            <div className={styles.stepContent}>
              {currentStep === 'termination' ? (
                <FinalSettlementWizardTerminationStep
                  employee={employee}
                  values={terminationValues}
                  onChange={setTerminationValues}
                  mode={mode}
                  onModeChange={setMode}
                  disabled={busy}
                />
              ) : null}

              {currentStep === 'review' ? (
                <FinalSettlementWizardReviewStep
                  mode={mode}
                  preview={preview}
                  previewLoading={previewMutation.isPending}
                  theme={theme}
                />
              ) : null}

              {currentStep === 'approval' && !settlement ? (
                <LoadingState message="Cargando liquidación…" theme={theme} layout="compact" />
              ) : null}

              {currentStep === 'approval' && settlement ? (
                <FinalSettlementWizardApprovalStep
                  settlement={settlement}
                  needsLegalValidation={needsLegalValidation}
                  legalValidation={legalValidationQuery.data}
                  needsReconciliation={needsReconciliation}
                  reconciliation={reconciliationQuery.data}
                  permissions={permissions}
                  busy={busy}
                  downloadingReceipt={receiptDownload.loading}
                  onOpenLegalValidationModal={() => setLegalValidationModalOpen(true)}
                  onOpenReconciliationModal={() => setReconciliationModalOpen(true)}
                  onOpenPayModal={() => setPayModalOpen(true)}
                  onOpenVoidModal={() => setVoidModalOpen(true)}
                  onApprove={() => void handleApprove()}
                  onRecalculate={() => void handleRecalculate()}
                  onDownloadReceipt={() => void receiptDownload.downloadReceipt(settlement.id)}
                />
              ) : null}
            </div>
          </RecetaWizardShell>
        </div>
      </div>

      {manualModalOpen ? (
        <FinalSettlementManualModal
          open={manualModalOpen}
          submitting={manualMutation.isPending}
          onConfirm={handleManualSubmit}
          onClose={() => setManualModalOpen(false)}
        />
      ) : null}

      {reconciliationModalOpen ? (
        <PendingSalaryReconciliationModal
          open={reconciliationModalOpen}
          submitting={reconcileMutation.isPending}
          onConfirm={handleReconcile}
          onClose={() => setReconciliationModalOpen(false)}
        />
      ) : null}

      {legalValidationModalOpen && settlement ? (
        <LegalFormulaValidationModal
          open={legalValidationModalOpen}
          formulaVersion={settlement.snapshotFormulaVersion}
          submitting={validateFormulaMutation.isPending}
          onConfirm={handleValidateFormula}
          onClose={() => setLegalValidationModalOpen(false)}
        />
      ) : null}

      {payModalOpen ? (
        <FinalSettlementPayModal
          open={payModalOpen}
          submitting={payMutation.isPending}
          onConfirm={handlePay}
          onClose={() => setPayModalOpen(false)}
        />
      ) : null}

      {voidModalOpen ? (
        <FinalSettlementVoidModal
          open={voidModalOpen}
          submitting={voidMutation.isPending}
          onConfirm={handleVoid}
          onClose={() => setVoidModalOpen(false)}
        />
      ) : null}
    </>
  );
}
