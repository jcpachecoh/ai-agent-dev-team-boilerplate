import { fireEvent, render, screen } from '@testing-library/react';

import { FinalSettlementWizardApprovalStep } from './FinalSettlementWizardApprovalStep';
import type { FinalSettlement, FinalSettlementStatus } from '../types/final-settlement.types';

function buildSettlement(overrides: Partial<FinalSettlement> = {}): FinalSettlement {
  return {
    id: 'settlement-1',
    tenantId: 'tenant-1',
    employeeDetailsId: 'emp-1',
    contractId: 'contract-1',
    effectiveTerminationDate: '2026-07-14',
    terminationReason: 'RENUNCIA',
    status: 'CALCULATED',
    mode: 'AUTOMATIC',
    snapshotFormulaVersion: 1,
    grossDevengados: '500000.00',
    totalDeducciones: '0.00',
    netAmount: '500000.00',
    snapshotNetNegativeAmount: '0.00',
    manualJustification: null,
    manualReference: null,
    manualResponsible: null,
    acceptedWarnings: [],
    auditTrail: [],
    createdBy: 'user-1',
    calculatedBy: 'user-1',
    calculatedAt: '2026-07-14T00:00:00.000Z',
    approvedBy: null,
    approvedAt: null,
    paidBy: null,
    paidAt: null,
    paymentReference: null,
    paymentDate: null,
    voidedBy: null,
    voidedAt: null,
    voidReason: null,
    createdAt: '2026-07-14T00:00:00.000Z',
    updatedAt: '2026-07-14T00:00:00.000Z',
    lines: [
      {
        id: 'line-1',
        tenantId: 'tenant-1',
        settlementId: 'settlement-1',
        code: 'CESANTIAS',
        name: 'Cesantías',
        type: 'DEVENGO',
        origin: 'AUTOMATIC',
        sourceReference: null,
        baseAmount: '2000000.00',
        quantity: '90',
        rate: null,
        amount: '500000.00',
        metadata: {},
        manualJustification: null,
        sortOrder: 0,
        createdAt: '2026-07-14T00:00:00.000Z',
      },
    ],
    ...overrides,
  };
}

const basePermissions = {
  canCalculate: true,
  canValidateLegalFormula: true,
  canReconcile: true,
  canApprove: true,
  canPay: true,
  canVoid: true,
};

function renderStep(
  overrides: Partial<FinalSettlement> = {},
  handlers: Partial<{ onDownloadReceipt: () => void }> = {},
): { onDownloadReceipt: () => void } {
  const onDownloadReceipt = handlers.onDownloadReceipt ?? vi.fn();
  render(
    <FinalSettlementWizardApprovalStep
      settlement={buildSettlement(overrides)}
      needsLegalValidation={false}
      legalValidation={null}
      needsReconciliation={false}
      reconciliation={null}
      permissions={basePermissions}
      onOpenLegalValidationModal={vi.fn()}
      onOpenReconciliationModal={vi.fn()}
      onOpenPayModal={vi.fn()}
      onOpenVoidModal={vi.fn()}
      onApprove={vi.fn()}
      onRecalculate={vi.fn()}
      onDownloadReceipt={onDownloadReceipt}
    />,
  );
  return { onDownloadReceipt };
}

describe('FinalSettlementWizardApprovalStep — descarga de comprobante', () => {
  it.each<FinalSettlementStatus>(['CALCULATED', 'APPROVED', 'PAID'])(
    'muestra el botón de descarga cuando el estado es %s',
    (status) => {
      renderStep({ status });

      expect(screen.getByRole('button', { name: 'Descargar comprobante' })).toBeInTheDocument();
    },
  );

  it('oculta el botón de descarga cuando la liquidación está VOIDED', () => {
    renderStep({ status: 'VOIDED', voidReason: 'Error de datos' });

    expect(screen.queryByRole('button', { name: 'Descargar comprobante' })).not.toBeInTheDocument();
  });

  it('invoca onDownloadReceipt al hacer clic', () => {
    const { onDownloadReceipt } = renderStep({ status: 'APPROVED' });

    fireEvent.click(screen.getByRole('button', { name: 'Descargar comprobante' }));

    expect(onDownloadReceipt).toHaveBeenCalledTimes(1);
  });

  it('deshabilita el botón mientras se está generando el comprobante', () => {
    render(
      <FinalSettlementWizardApprovalStep
        settlement={buildSettlement({ status: 'PAID' })}
        needsLegalValidation={false}
        legalValidation={null}
        needsReconciliation={false}
        reconciliation={null}
        permissions={basePermissions}
        downloadingReceipt
        onOpenLegalValidationModal={vi.fn()}
        onOpenReconciliationModal={vi.fn()}
        onOpenPayModal={vi.fn()}
        onOpenVoidModal={vi.fn()}
        onApprove={vi.fn()}
        onRecalculate={vi.fn()}
        onDownloadReceipt={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Generando…' })).toBeDisabled();
  });
});
