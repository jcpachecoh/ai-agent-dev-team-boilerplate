import { ConflictException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { AuditAction, FinalSettlementStatus } from '@prisma/client';

import { AuditService } from '../../audit/service/audit.service';
import type { EmploymentContractRecord } from '../interfaces/employee-contract.interfaces';
import type { FinalSettlementRecord } from '../interfaces/final-settlement.interfaces';
import { EmployeeContractRepository } from '../repository/employee-contract.repository';
import { FinalSettlementRepository } from '../repository/final-settlement.repository';
import { EmployeeDeactivationGuardService } from '../service/employee-deactivation-guard.service';

const TENANT_ID = 'tenant-test-001';
const EMPLOYEE_ID = 'emp-001';
const CONTRACT_ID = 'contract-001';

function mockContract(overrides: Partial<EmploymentContractRecord> = {}): EmploymentContractRecord {
  return {
    id: CONTRACT_ID,
    tenantId: TENANT_ID,
    employeeDetailsId: EMPLOYEE_ID,
    contractType: 'INDEFINIDO',
    startDate: new Date('2020-01-01'),
    agreedEndDate: null,
    status: 'ACTIVO',
    terminationDate: null,
    terminationReason: null,
    terminationNotes: null,
    activeSlot: true,
    changedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as EmploymentContractRecord;
}

function mockSettlement(overrides: Partial<FinalSettlementRecord> = {}): FinalSettlementRecord {
  return {
    id: 'settlement-001',
    status: FinalSettlementStatus.CALCULATED,
    ...overrides,
  } as FinalSettlementRecord;
}

describe('EmployeeDeactivationGuardService', (): void => {
  let service: EmployeeDeactivationGuardService;
  let mockFindActiveContract: jest.Mock;
  let mockFindActiveByContract: jest.Mock;
  let mockAuditLog: jest.Mock;

  beforeEach(async (): Promise<void> => {
    mockFindActiveContract = jest.fn();
    mockFindActiveByContract = jest.fn();
    mockAuditLog = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeDeactivationGuardService,
        {
          provide: EmployeeContractRepository,
          useValue: { findActiveContract: mockFindActiveContract },
        },
        {
          provide: FinalSettlementRepository,
          useValue: { findActiveByContract: mockFindActiveByContract },
        },
        { provide: AuditService, useValue: { log: mockAuditLog } },
      ],
    }).compile();

    service = module.get<EmployeeDeactivationGuardService>(EmployeeDeactivationGuardService);
  });

  it('permite desactivar cuando el empleado no tiene contrato ACTIVO (ya terminado)', async (): Promise<void> => {
    mockFindActiveContract.mockResolvedValue(null);

    await expect(
      service.assertCanDeactivate(TENANT_ID, EMPLOYEE_ID, 'actor-001'),
    ).resolves.toBeUndefined();
    expect(mockFindActiveByContract).not.toHaveBeenCalled();
    expect(mockAuditLog).not.toHaveBeenCalled();
  });

  it('permite desactivar cuando la liquidación activa del contrato está APPROVED', async (): Promise<void> => {
    mockFindActiveContract.mockResolvedValue(mockContract());
    mockFindActiveByContract.mockResolvedValue(
      mockSettlement({ status: FinalSettlementStatus.APPROVED }),
    );

    await expect(
      service.assertCanDeactivate(TENANT_ID, EMPLOYEE_ID, 'actor-001'),
    ).resolves.toBeUndefined();
  });

  it('permite desactivar cuando la liquidación activa del contrato está PAID', async (): Promise<void> => {
    mockFindActiveContract.mockResolvedValue(mockContract());
    mockFindActiveByContract.mockResolvedValue(
      mockSettlement({ status: FinalSettlementStatus.PAID }),
    );

    await expect(
      service.assertCanDeactivate(TENANT_ID, EMPLOYEE_ID, 'actor-001'),
    ).resolves.toBeUndefined();
  });

  it('bloquea la desactivación cuando hay contrato ACTIVO y ninguna liquidación', async (): Promise<void> => {
    mockFindActiveContract.mockResolvedValue(mockContract());
    mockFindActiveByContract.mockResolvedValue(null);

    await expect(service.assertCanDeactivate(TENANT_ID, EMPLOYEE_ID, 'actor-001')).rejects.toThrow(
      ConflictException,
    );
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT_ID,
        action: AuditAction.REJECT,
        entityType: 'EmployeeDetails',
        entityId: EMPLOYEE_ID,
        payload: expect.objectContaining({ event: 'employee_deactivation_blocked' }),
      }),
    );
  });

  it('bloquea la desactivación cuando la liquidación activa está en CALCULATED (aún no aprobada)', async (): Promise<void> => {
    mockFindActiveContract.mockResolvedValue(mockContract());
    mockFindActiveByContract.mockResolvedValue(
      mockSettlement({ status: FinalSettlementStatus.CALCULATED }),
    );

    await expect(service.assertCanDeactivate(TENANT_ID, EMPLOYEE_ID, 'actor-001')).rejects.toThrow(
      ConflictException,
    );
  });

  it('bloquea la desactivación cuando la liquidación activa está VOIDED', async (): Promise<void> => {
    mockFindActiveContract.mockResolvedValue(mockContract());
    mockFindActiveByContract.mockResolvedValue(
      mockSettlement({ status: FinalSettlementStatus.VOIDED }),
    );

    await expect(service.assertCanDeactivate(TENANT_ID, EMPLOYEE_ID, 'actor-001')).rejects.toThrow(
      ConflictException,
    );
  });

  it('consulta findActiveByContract con el contractId del contrato activo (aislamiento por contrato)', async (): Promise<void> => {
    mockFindActiveContract.mockResolvedValue(mockContract({ id: 'contract-XYZ' }));
    mockFindActiveByContract.mockResolvedValue(
      mockSettlement({ status: FinalSettlementStatus.APPROVED }),
    );

    await service.assertCanDeactivate(TENANT_ID, EMPLOYEE_ID);

    expect(mockFindActiveByContract).toHaveBeenCalledWith(TENANT_ID, 'contract-XYZ');
  });

  it('recontratación: una liquidación APPROVED del contrato TERMINADO anterior NO habilita la desactivación del contrato ACTIVO nuevo', async (): Promise<void> => {
    // Escenario real: el empleado tuvo un contrato A (TERMINADO), con una liquidación
    // APPROVED ya aprobada para ese contrato. Luego fue recontratado — contrato B, ACTIVO,
    // SIN liquidación propia todavía (ver EmployeeContractService.rehire, tasks/OS-591.md
    // §15.5/§3). El gate debe consultar la liquidación del contrato ACTIVO actual (B), no
    // reutilizar la del contrato histórico (A) — `findActiveByContract` ya está acotado por
    // `contractId` exacto (ver final-settlement.repository.spec.ts:findActiveByContract), así
    // que devuelve null para B aunque exista una liquidación APPROVED para A.
    const oldTerminatedContractId = 'contract-A-terminado';
    const newActiveContractId = 'contract-B-recontratado';

    mockFindActiveContract.mockResolvedValue(mockContract({ id: newActiveContractId }));
    // Simula el comportamiento real del repositorio: solo "ve" liquidaciones del
    // contractId consultado (B) — la liquidación histórica de A nunca aparece aquí.
    mockFindActiveByContract.mockImplementation(
      (tenantId: string, contractId: string): Promise<FinalSettlementRecord | null> =>
        Promise.resolve(
          contractId === oldTerminatedContractId
            ? mockSettlement({ id: 'settlement-old', status: FinalSettlementStatus.APPROVED })
            : null,
        ),
    );

    await expect(service.assertCanDeactivate(TENANT_ID, EMPLOYEE_ID, 'actor-001')).rejects.toThrow(
      ConflictException,
    );

    expect(mockFindActiveByContract).toHaveBeenCalledWith(TENANT_ID, newActiveContractId);
    expect(mockFindActiveByContract).not.toHaveBeenCalledWith(TENANT_ID, oldTerminatedContractId);
  });

  it('aislamiento multi-tenant: solo consulta el contrato activo del tenant solicitado', async (): Promise<void> => {
    mockFindActiveContract.mockResolvedValue(mockContract({ id: 'contract-XYZ' }));
    mockFindActiveByContract.mockResolvedValue(
      mockSettlement({ status: FinalSettlementStatus.APPROVED }),
    );

    await service.assertCanDeactivate('otro-tenant', EMPLOYEE_ID);

    expect(mockFindActiveContract).toHaveBeenCalledWith('otro-tenant', EMPLOYEE_ID);
    expect(mockFindActiveByContract).toHaveBeenCalledWith('otro-tenant', 'contract-XYZ');
  });
});
