import { NotFoundException } from '@nestjs/common';
import { EmployeeContractType } from '@prisma/client';

import type { PrismaService } from '../../prisma/prisma.service';
import type { EmploymentContractRecord } from '../interfaces/employee-contract.interfaces';
import type { EmployeeContractRepository } from '../repository/employee-contract.repository';
import { EmployeeContractService } from '../service/employee-contract.service';

function contractRecord(
  overrides: Partial<EmploymentContractRecord> = {},
): EmploymentContractRecord {
  return {
    id: 'contract-1',
    tenantId: 'tenant-1',
    employeeDetailsId: 'emp-1',
    contractType: EmployeeContractType.INDEFINIDO,
    startDate: new Date('2024-01-01'),
    agreedEndDate: null,
    status: 'ACTIVO',
    terminationDate: null,
    terminationReason: null,
    terminationNotes: null,
    activeSlot: true,
    changedBy: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

describe('EmployeeContractService', (): void => {
  let service: EmployeeContractService;
  let findActiveContract: jest.Mock;
  let findAllByEmployee: jest.Mock;
  let terminateActiveContractTx: jest.Mock;
  let startNewContractTx: jest.Mock;
  let $transaction: jest.Mock;

  beforeEach((): void => {
    findActiveContract = jest.fn();
    findAllByEmployee = jest.fn();
    terminateActiveContractTx = jest.fn();
    startNewContractTx = jest.fn();
    $transaction = jest.fn().mockImplementation((cb: (tx: unknown) => unknown): unknown => cb({}));

    const repository = {
      findActiveContract,
      findAllByEmployee,
      terminateActiveContractTx,
      startNewContractTx,
    } as unknown as EmployeeContractRepository;
    const prisma = { $transaction } as unknown as PrismaService;

    service = new EmployeeContractService(repository, prisma);
  });

  describe('getActiveContract', (): void => {
    it('delega en el repositorio', async (): Promise<void> => {
      findActiveContract.mockResolvedValue(contractRecord());

      const result = await service.getActiveContract('tenant-1', 'emp-1');

      expect(findActiveContract).toHaveBeenCalledWith('tenant-1', 'emp-1');
      expect(result?.status).toBe('ACTIVO');
    });
  });

  describe('listByEmployee', (): void => {
    it('delega en el repositorio', async (): Promise<void> => {
      findAllByEmployee.mockResolvedValue([contractRecord()]);

      const result = await service.listByEmployee('tenant-1', 'emp-1');

      expect(findAllByEmployee).toHaveBeenCalledWith('tenant-1', 'emp-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('terminateActiveContract', (): void => {
    it('lanza NotFoundException si no hay contrato ACTIVO', async (): Promise<void> => {
      findActiveContract.mockResolvedValue(null);

      await expect(
        service.terminateActiveContract('tenant-1', 'emp-1', {
          terminationDate: new Date('2026-07-14'),
          terminationReason: 'RENUNCIA',
        }),
      ).rejects.toThrow(NotFoundException);
      expect($transaction).not.toHaveBeenCalled();
    });

    it('termina el contrato ACTIVO dentro de una transacción', async (): Promise<void> => {
      findActiveContract.mockResolvedValue(contractRecord());
      terminateActiveContractTx.mockResolvedValue(
        contractRecord({ status: 'TERMINADO', activeSlot: null }),
      );

      const result = await service.terminateActiveContract(
        'tenant-1',
        'emp-1',
        { terminationDate: new Date('2026-07-14'), terminationReason: 'RENUNCIA' },
        'user-9',
      );

      expect($transaction).toHaveBeenCalled();
      expect(terminateActiveContractTx).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          tenantId: 'tenant-1',
          employeeDetailsId: 'emp-1',
          terminationReason: 'RENUNCIA',
          changedBy: 'user-9',
        }),
      );
      expect(result.status).toBe('TERMINADO');
    });
  });

  describe('rehire', (): void => {
    it('crea un nuevo contrato ACTIVO dentro de una transacción (recontratación)', async (): Promise<void> => {
      startNewContractTx.mockResolvedValue(contractRecord({ id: 'contract-2' }));

      const result = await service.rehire(
        'tenant-1',
        'emp-1',
        { contractType: EmployeeContractType.OBRA, startDate: new Date('2026-06-16') },
        'user-9',
      );

      expect($transaction).toHaveBeenCalled();
      expect(startNewContractTx).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          tenantId: 'tenant-1',
          employeeDetailsId: 'emp-1',
          contractType: EmployeeContractType.OBRA,
          changedBy: 'user-9',
        }),
      );
      expect(result.id).toBe('contract-2');
    });
  });
});
