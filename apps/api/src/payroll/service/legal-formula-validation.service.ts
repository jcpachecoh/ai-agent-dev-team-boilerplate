import { BadRequestException, Injectable } from '@nestjs/common';
import { AuditAction } from '@prisma/client';

import { AuditService } from '../../audit/service/audit.service';
import {
  CreateLegalFormulaValidationData,
  ILegalFormulaValidationService,
  IndemnificationFormulaValidationRecord,
} from '../interfaces/legal-formula-validation.interfaces';
import { LegalFormulaValidationRepository } from '../repository/legal-formula-validation.repository';

/**
 * OS-591 (fase 3) — Validación legal de la versión de fórmula de indemnización.
 * Ver tasks/OS-591.md §15.1. Independiente del estado operativo de cualquier
 * `FinalSettlement` — el gate real vive en `FinalSettlementService.approve()`.
 */
@Injectable()
export class LegalFormulaValidationService implements ILegalFormulaValidationService {
  constructor(
    private readonly repository: LegalFormulaValidationRepository,
    private readonly auditService: AuditService,
  ) {}

  async findActive(
    tenantId: string,
    formulaVersion: number,
  ): Promise<IndemnificationFormulaValidationRecord | null> {
    return this.repository.findActive(tenantId, formulaVersion);
  }

  async listByTenant(tenantId: string): Promise<IndemnificationFormulaValidationRecord[]> {
    return this.repository.findAllByTenant(tenantId);
  }

  async validate(
    data: CreateLegalFormulaValidationData,
  ): Promise<IndemnificationFormulaValidationRecord> {
    if (!data.legalReference?.trim()) {
      throw new BadRequestException(
        'legalReference es obligatorio — debe citar la norma/concepto legal que sustenta la validación',
      );
    }
    if (!data.validatedBy?.trim()) {
      throw new BadRequestException('validatedBy (responsable) es obligatorio');
    }

    const record = await this.repository.create(data);

    await this.auditService.log({
      tenantId: data.tenantId,
      action: AuditAction.APPROVE,
      entityType: 'IndemnificationFormulaValidation',
      entityId: record.id,
      actorUserId: data.validatedBy,
      payload: {
        event: 'legal_formula_validated',
        formulaVersion: record.formulaVersion,
        legalReference: record.legalReference,
      },
    });

    return record;
  }
}
