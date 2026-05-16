import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../service/audit.service';
import { AuditRepository } from '../repository/audit.repository';

const repoMock = {
  create: jest.fn(),
};

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService, { provide: AuditRepository, useValue: repoMock }],
    }).compile();

    service = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('delegates to repository.create with all fields', async () => {
      repoMock.create.mockResolvedValue(undefined);
      await service.log({
        action: 'CREATE',
        entity: 'projects',
        entityId: 'proj-1',
        userId: 'user-1',
        payload: { name: 'Alpha' },
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      });
      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATE',
          entity: 'projects',
          entityId: 'proj-1',
          userId: 'user-1',
          ipAddress: '127.0.0.1',
          userAgent: 'jest',
        }),
      );
    });

    it('passes null for optional fields when not provided', async () => {
      repoMock.create.mockResolvedValue(undefined);
      await service.log({ action: 'DELETE', entity: 'cases', entityId: 'c-1' });
      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: null,
          ipAddress: null,
          userAgent: null,
        }),
      );
    });
  });
});
