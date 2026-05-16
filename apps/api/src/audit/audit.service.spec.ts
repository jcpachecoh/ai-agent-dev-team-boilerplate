import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';

const prismaMock = {
  auditLog: {
    create: jest.fn(),
  },
};

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('creates an audit log record with all fields', async () => {
      prismaMock.auditLog.create.mockResolvedValue({});
      await service.log({
        action: 'CREATE',
        entity: 'projects',
        entityId: 'proj-1',
        userId: 'user-1',
        payload: { name: 'Alpha' },
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      });
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'CREATE',
          entity: 'projects',
          entityId: 'proj-1',
          userId: 'user-1',
          ipAddress: '127.0.0.1',
          userAgent: 'jest',
        }),
      });
    });

    it('stores null for optional fields when not provided', async () => {
      prismaMock.auditLog.create.mockResolvedValue({});
      await service.log({ action: 'DELETE', entity: 'cases', entityId: 'c-1' });
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: null,
          ipAddress: null,
          userAgent: null,
        }),
      });
    });
  });
});
