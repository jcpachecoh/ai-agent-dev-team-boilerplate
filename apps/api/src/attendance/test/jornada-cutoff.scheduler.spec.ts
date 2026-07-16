import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { JornadaCutoffScheduler } from '../jobs/jornada-cutoff.scheduler';
import { JornadaCutoffService } from '../service/jornada-cutoff.service';

describe('JornadaCutoffScheduler', () => {
  let scheduler: JornadaCutoffScheduler;

  const prismaMock = {
    tenant: {
      findMany: jest.fn(),
    },
  };

  const cutoffServiceMock = {
    runDueCutoffsForTenant: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    delete process.env.JORNADA_CUTOFF_SCHEDULER_ENABLED;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JornadaCutoffScheduler,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JornadaCutoffService, useValue: cutoffServiceMock },
      ],
    }).compile();

    scheduler = module.get(JornadaCutoffScheduler);
  });

  it('procesa tenants activos y aísla errores por tenant', async () => {
    prismaMock.tenant.findMany.mockResolvedValue([{ id: 't1' }, { id: 't2' }]);
    cutoffServiceMock.runDueCutoffsForTenant
      .mockResolvedValueOnce(1)
      .mockRejectedValueOnce(new Error('boom'));

    await expect(scheduler.handleCron()).resolves.toBeUndefined();
    expect(cutoffServiceMock.runDueCutoffsForTenant).toHaveBeenCalledTimes(2);
  });

  it('no corre cuando scheduler está deshabilitado', async () => {
    process.env.JORNADA_CUTOFF_SCHEDULER_ENABLED = 'false';
    await scheduler.handleCron();
    expect(prismaMock.tenant.findMany).not.toHaveBeenCalled();
  });
});
