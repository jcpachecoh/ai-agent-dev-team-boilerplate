import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NovedadType } from '@prisma/client';

import { NovedadTypeConfigRepository } from '../repository/novedad-type-config.repository';
import { NovedadTypeConfigService } from '../service/novedad-type-config.service';

const TENANT = 'tenant-1';

const mockConfig = {
  id: 'cfg-1',
  tenantId: TENANT,
  type: NovedadType.PERMISO_REMUNERADO,
  requiresSupervisorApproval: true,
  requiresSupportDocument: false,
  isPaidDefault: true,
  autoSolicitable: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('NovedadTypeConfigService', () => {
  let service: NovedadTypeConfigService;
  let repository: jest.Mocked<NovedadTypeConfigRepository>;

  beforeEach(async () => {
    repository = {
      findByTenantAndType: jest.fn(),
      listByTenant: jest.fn(),
      upsert: jest.fn(),
      ensureDefaultsForTenant: jest.fn(),
    } as unknown as jest.Mocked<NovedadTypeConfigRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NovedadTypeConfigService,
        { provide: NovedadTypeConfigRepository, useValue: repository },
      ],
    }).compile();

    service = module.get(NovedadTypeConfigService);
  });

  describe('getConfigForTenant', () => {
    it('ensures defaults and returns config', async () => {
      repository.findByTenantAndType.mockResolvedValue(mockConfig);

      const result = await service.getConfigForTenant(TENANT, NovedadType.PERMISO_REMUNERADO);

      expect(repository.ensureDefaultsForTenant).toHaveBeenCalledWith(TENANT);
      expect(result.type).toBe(NovedadType.PERMISO_REMUNERADO);
    });

    it('throws when config is missing after ensureDefaults', async () => {
      repository.findByTenantAndType.mockResolvedValue(null);

      await expect(
        service.getConfigForTenant(TENANT, NovedadType.PERMISO_REMUNERADO),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listConfigs', () => {
    it('ensures defaults and lists configs', async () => {
      repository.listByTenant.mockResolvedValue([mockConfig]);

      const result = await service.listConfigs(TENANT);

      expect(repository.ensureDefaultsForTenant).toHaveBeenCalledWith(TENANT);
      expect(result).toHaveLength(1);
    });
  });

  describe('updateConfig', () => {
    it('rejects invalid novedad type', async () => {
      await expect(
        service.updateConfig(TENANT, 'INVALID' as NovedadType, {
          requiresSupervisorApproval: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('upserts config for valid type', async () => {
      repository.upsert.mockResolvedValue({
        ...mockConfig,
        requiresSupervisorApproval: false,
      });

      const result = await service.updateConfig(TENANT, NovedadType.PERMISO_REMUNERADO, {
        requiresSupervisorApproval: false,
      });

      expect(repository.ensureDefaultsForTenant).toHaveBeenCalledWith(TENANT);
      expect(result.requiresSupervisorApproval).toBe(false);
    });
  });
});
