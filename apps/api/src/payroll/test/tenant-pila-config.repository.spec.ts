import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { TenantPilaConfigRepository } from '../repository/tenant-pila-config.repository';

/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/explicit-function-return-type */

describe('TenantPilaConfigRepository', () => {
  let repository: TenantPilaConfigRepository;
  let prisma: {
    tenantPilaConfig: { findUnique: jest.Mock; upsert: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      tenantPilaConfig: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantPilaConfigRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();
    repository = module.get(TenantPilaConfigRepository);
  });

  it('findByTenantId consulta unique por tenantId', async () => {
    prisma.tenantPilaConfig.findUnique.mockResolvedValue({ tenantId: 't1' });
    await expect(repository.findByTenantId('t1')).resolves.toEqual({ tenantId: 't1' });
    expect(prisma.tenantPilaConfig.findUnique).toHaveBeenCalledWith({
      where: { tenantId: 't1' },
    });
  });

  it('upsert usa defaults en create cuando faltan campos', async () => {
    prisma.tenantPilaConfig.upsert.mockResolvedValue({ id: '1' });
    await repository.upsert('t1', {});
    expect(prisma.tenantPilaConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 't1' },
        create: expect.objectContaining({
          tenantId: 't1',
          documentType: 'NI',
          claseAportante: 'B',
          naturalezaJuridica: '2',
          formaPresentacion: 'U',
          tipoAportante: '01',
          arlCode: null,
          actividadEconomicaArl: null,
          exemptFromHealthSenaIcbfLey1607: false,
        }),
        update: {},
      }),
    );
  });

  it('upsert incluye solo campos definidos en update', async () => {
    prisma.tenantPilaConfig.upsert.mockResolvedValue({ id: '1' });
    await repository.upsert('t1', {
      documentType: 'CC',
      claseAportante: 'A',
      naturalezaJuridica: '1',
      formaPresentacion: 'S',
      tipoAportante: '02',
      arlCode: '14-11',
      actividadEconomicaArl: '5611001',
      exemptFromHealthSenaIcbfLey1607: true,
    });
    expect(prisma.tenantPilaConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          documentType: 'CC',
          claseAportante: 'A',
          naturalezaJuridica: '1',
          formaPresentacion: 'S',
          tipoAportante: '02',
          arlCode: '14-11',
          actividadEconomicaArl: '5611001',
          exemptFromHealthSenaIcbfLey1607: true,
        }),
        update: {
          documentType: 'CC',
          claseAportante: 'A',
          naturalezaJuridica: '1',
          formaPresentacion: 'S',
          tipoAportante: '02',
          arlCode: '14-11',
          actividadEconomicaArl: '5611001',
          exemptFromHealthSenaIcbfLey1607: true,
        },
      }),
    );
  });
});
