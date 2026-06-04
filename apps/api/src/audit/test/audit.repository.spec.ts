import { Test, TestingModule } from '@nestjs/testing';
import { AuditRepository } from '../repository/audit.repository';
import { PrismaService } from '../../prisma/prisma.service';

const prismaMock = {
  auditLog: {
    create: jest.fn(),
  },
};

describe('AuditRepository', () => {
  let repo: AuditRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repo = module.get<AuditRepository>(AuditRepository);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates an audit log record with all fields', async () => {
      prismaMock.auditLog.create.mockResolvedValue({});
      await repo.create({
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
      await repo.create({ action: 'DELETE', entity: 'cases', entityId: 'c-1' });
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
