import { ConflictException, Injectable } from '@nestjs/common';
import { AuditAction } from '@prisma/client';

import { AuditService } from '../../audit/service/audit.service';
import { EmployeeContractRepository } from '../repository/employee-contract.repository';
import { FinalSettlementRepository } from '../repository/final-settlement.repository';

/**
 * OS-591 (fase 3) — Gate único y reutilizable de desactivación de empleados.
 * Ver tasks/OS-591.md §15.5. Invocado por AMBAS rutas que llegan a
 * `EmployeeDetails.isActive=false`: `PayrollService.remove()` (soft-delete dedicado) y
 * `PayrollService.update()` (ruta alterna vía `isActive: false` en el patch) — ninguna de
 * las dos vuelve a implementar esta validación por su cuenta.
 */
@Injectable()
export class EmployeeDeactivationGuardService {
  constructor(
    private readonly contractRepository: EmployeeContractRepository,
    private readonly finalSettlementRepository: FinalSettlementRepository,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Lanza `ConflictException` si el empleado tiene un contrato ACTIVO sin una liquidación
   * definitiva APPROVED/PAID que lo respalde. Si no tiene contrato ACTIVO (ya terminado por
   * un flujo previo de aprobación, ver §15.4), no hay nada que proteger — permite (idempotente).
   */
  async assertCanDeactivate(
    tenantId: string,
    employeeDetailsId: string,
    actor?: string | null,
  ): Promise<void> {
    const contract = await this.contractRepository.findActiveContract(tenantId, employeeDetailsId);
    if (!contract) {
      return;
    }

    const settlement = await this.finalSettlementRepository.findActiveByContract(
      tenantId,
      contract.id,
    );
    const isSettled = settlement?.status === 'APPROVED' || settlement?.status === 'PAID';

    if (isSettled) {
      return;
    }

    await this.auditService.log({
      tenantId,
      action: AuditAction.REJECT,
      entityType: 'EmployeeDetails',
      entityId: employeeDetailsId,
      actorUserId: actor ?? null,
      payload: {
        event: 'employee_deactivation_blocked',
        contractId: contract.id,
        settlementId: settlement?.id ?? null,
        settlementStatus: settlement?.status ?? null,
      },
    });

    throw new ConflictException(
      settlement
        ? `No se puede desactivar: la liquidación definitiva ${settlement.id} del contrato activo está en estado ${settlement.status}; se requiere APPROVED o PAID.`
        : 'No se puede desactivar: el empleado tiene un contrato ACTIVO sin una liquidación definitiva. Calcule y apruebe una liquidación antes de desactivar.',
    );
  }
}
