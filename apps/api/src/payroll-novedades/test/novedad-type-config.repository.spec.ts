import { Test, TestingModule } from '@nestjs/testing';
import { NovedadType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { NovedadTypeConfigRepository } from '../repository/novedad-type-config.repository';

const TENANT = 'tenant-1';

const mockConfigRow = {
  id: 'cfg-1',
  tenantId: TENANT,
  type: NovedadType.PERMISO_REMUNERADO,
  requiresSupervisorApproval: true,
  requiresSupportDocument: false,
  isPaidDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('NovedadTypeConfigRepository', () => {
  let repository: NovedadTypeConfigRepository;
  let prisma: {
    novedadTypeConfig: jest.Mocked<Record<string, jest.Mock>>;
  };

  beforeEach(async () => {
    prisma = {
      novedadTypeConfig: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [NovedadTypeConfigRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get(NovedadTypeConfigRepository);
  });

  describe('findByTenantAndType', () => {
    it('returns mapped config when found', async () => {
      prisma.novedadTypeConfig.findUnique.mockResolvedValue(mockConfigRow);

      const result = await repository.findByTenantAndType(TENANT, NovedadType.PERMISO_REMUNERADO);

      expect(prisma.novedadTypeConfig.findUnique).toHaveBeenCalledWith({
        where: { tenantId_type: { tenantId: TENANT, type: NovedadType.PERMISO_REMUNERADO } },
      });
      expect(result?.type).toBe(NovedadType.PERMISO_REMUNERADO);
    });

    it('returns null when config does not exist', async () => {
      prisma.novedadTypeConfig.findUnique.mockResolvedValue(null);

      const result = await repository.findByTenantAndType(TENANT, NovedadType.LICENCIA_LUTO);

      expect(result).toBeNull();
    });
  });

  describe('listByTenant', () => {
    it('returns mapped configs ordered by type', async () => {
      prisma.novedadTypeConfig.findMany.mockResolvedValue([mockConfigRow]);

      const result = await repository.listByTenant(TENANT);

      expect(prisma.novedadTypeConfig.findMany).toHaveBeenCalledWith({
        where: { tenantId: TENANT },
        orderBy: { type: 'asc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('upsert', () => {
    it('updates only provided fields', async () => {
      prisma.novedadTypeConfig.upsert.mockResolvedValue({
        ...mockConfigRow,
        requiresSupervisorApproval: false,
      });

      const result = await repository.upsert(TENANT, NovedadType.PERMISO_REMUNERADO, {
        requiresSupervisorApproval: false,
      });

      expect(prisma.novedadTypeConfig.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { requiresSupervisorApproval: false },
        }),
      );
      expect(result.requiresSupervisorApproval).toBe(false);
    });
  });

  describe('ensureDefaultsForTenant', () => {
    it('upserts default configs for all novedad types', async () => {
      prisma.novedadTypeConfig.upsert.mockResolvedValue(mockConfigRow);

      await repository.ensureDefaultsForTenant(TENANT);

      expect(prisma.novedadTypeConfig.upsert).toHaveBeenCalledTimes(8);
      expect(prisma.novedadTypeConfig.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId_type: { tenantId: TENANT, type: NovedadType.AUSENCIA_INJUSTIFICADA },
          },
        }),
      );
    });
  });
});
