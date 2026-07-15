import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { AuditAction } from '@prisma/client';

import { AuditService } from '../../audit/service/audit.service';
import type { IndemnificationFormulaValidationRecord } from '../interfaces/legal-formula-validation.interfaces';
import { LegalFormulaValidationRepository } from '../repository/legal-formula-validation.repository';
import { LegalFormulaValidationService } from '../service/legal-formula-validation.service';

const TENANT_ID = 'tenant-test-001';

function mockRecord(
  overrides: Partial<IndemnificationFormulaValidationRecord> = {},
): IndemnificationFormulaValidationRecord {
  return {
    id: 'validation-001',
    tenantId: TENANT_ID,
    formulaVersion: 1,
    isActive: true,
    legalReference: 'Concepto Jurídico 001-2026',
    observations: null,
    validatedBy: 'legal-001',
    validatedAt: new Date('2026-01-01'),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('LegalFormulaValidationService', (): void => {
  let service: LegalFormulaValidationService;
  let mockFindActive: jest.Mock;
  let mockFindAllByTenant: jest.Mock;
  let mockCreate: jest.Mock;
  let mockAuditLog: jest.Mock;

  beforeEach(async (): Promise<void> => {
    mockFindActive = jest.fn();
    mockFindAllByTenant = jest.fn();
    mockCreate = jest.fn().mockResolvedValue(mockRecord());
    mockAuditLog = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LegalFormulaValidationService,
        {
          provide: LegalFormulaValidationRepository,
          useValue: {
            findActive: mockFindActive,
            findAllByTenant: mockFindAllByTenant,
            create: mockCreate,
          },
        },
        { provide: AuditService, useValue: { log: mockAuditLog } },
      ],
    }).compile();

    service = module.get<LegalFormulaValidationService>(LegalFormulaValidationService);
  });

  describe('validate', (): void => {
    const input = {
      tenantId: TENANT_ID,
      formulaVersion: 1,
      legalReference: 'Concepto Jurídico 001-2026',
      validatedBy: 'legal-001',
      validatedAt: new Date('2026-01-01'),
    };

    it('crea la validación y registra el evento legal_formula_validated', async (): Promise<void> => {
      const result = await service.validate(input);

      expect(mockCreate).toHaveBeenCalledWith(input);
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT_ID,
          action: AuditAction.APPROVE,
          entityType: 'IndemnificationFormulaValidation',
          payload: expect.objectContaining({ event: 'legal_formula_validated' }),
        }),
      );
      expect(result.formulaVersion).toBe(1);
    });

    it('lanza BadRequestException si legalReference está vacío', async (): Promise<void> => {
      await expect(service.validate({ ...input, legalReference: '  ' })).rejects.toThrow(
        BadRequestException,
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException si validatedBy está vacío', async (): Promise<void> => {
      await expect(service.validate({ ...input, validatedBy: '' })).rejects.toThrow(
        BadRequestException,
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe('findActive', (): void => {
    it('delega al repositorio', async (): Promise<void> => {
      mockFindActive.mockResolvedValue(mockRecord());

      const result = await service.findActive(TENANT_ID, 1);

      expect(mockFindActive).toHaveBeenCalledWith(TENANT_ID, 1);
      expect(result?.formulaVersion).toBe(1);
    });
  });

  describe('listByTenant', (): void => {
    it('delega al repositorio', async (): Promise<void> => {
      mockFindAllByTenant.mockResolvedValue([mockRecord()]);

      const result = await service.listByTenant(TENANT_ID);

      expect(mockFindAllByTenant).toHaveBeenCalledWith(TENANT_ID);
      expect(result).toHaveLength(1);
    });
  });
});
