import { Injectable } from '@nestjs/common';
import { IndemnificationFormulaValidation } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateLegalFormulaValidationData,
  ILegalFormulaValidationRepository,
  IndemnificationFormulaValidationRecord,
} from '../interfaces/legal-formula-validation.interfaces';

/**
 * OS-591 (fase 3) — Persistencia de validaciones legales de la fórmula de indemnización.
 * Ver tasks/OS-591.md §15.1.
 */
@Injectable()
export class LegalFormulaValidationRepository implements ILegalFormulaValidationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActive(
    tenantId: string,
    formulaVersion: number,
  ): Promise<IndemnificationFormulaValidationRecord | null> {
    const row = await this.prisma.indemnificationFormulaValidation.findFirst({
      where: { tenantId, formulaVersion, isActive: true },
    });
    return row ? this.map(row) : null;
  }

  async findAllByTenant(tenantId: string): Promise<IndemnificationFormulaValidationRecord[]> {
    const rows = await this.prisma.indemnificationFormulaValidation.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row): IndemnificationFormulaValidationRecord => this.map(row));
  }

  async create(
    data: CreateLegalFormulaValidationData,
  ): Promise<IndemnificationFormulaValidationRecord> {
    const row = await this.prisma.$transaction(
      async (tx): Promise<IndemnificationFormulaValidation> => {
        // Revalidar no sobre-escribe: desactiva la vigente y crea una fila nueva —
        // conserva el historial completo de quién validó qué y cuándo.
        await tx.indemnificationFormulaValidation.updateMany({
          where: { tenantId: data.tenantId, formulaVersion: data.formulaVersion, isActive: true },
          data: { isActive: false },
        });

        return tx.indemnificationFormulaValidation.create({
          data: {
            tenantId: data.tenantId,
            formulaVersion: data.formulaVersion,
            legalReference: data.legalReference,
            observations: data.observations ?? null,
            validatedBy: data.validatedBy,
            validatedAt: data.validatedAt,
            isActive: true,
          },
        });
      },
    );
    return this.map(row);
  }

  private map(row: IndemnificationFormulaValidation): IndemnificationFormulaValidationRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      formulaVersion: row.formulaVersion,
      isActive: row.isActive,
      legalReference: row.legalReference,
      observations: row.observations,
      validatedBy: row.validatedBy,
      validatedAt: row.validatedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
