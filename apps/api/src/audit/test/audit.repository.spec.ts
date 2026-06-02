import { Test, TestingModule } from '@nestjs/testing';
import { AuditAction, AuthMethod, LoginAuditStatus } from '@prisma/client';
import { AuditRepository } from '../repository/audit.repository';
import { PrismaService } from '../../prisma/prisma.service';

const prismaMock = {
  auditLog: {
    create: jest.fn(),
  },
  loginAudit: {
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
        tenantId: 't-1',
        action: AuditAction.CREATE,
        entityType: 'projects',
        entityId: 'proj-1',
        actorUserId: 'user-1',
        newValue: { name: 'Alpha' },
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      });
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 't-1',
          action: AuditAction.CREATE,
          entityType: 'projects',
          entityId: 'proj-1',
          actorUserId: 'user-1',
          ipAddress: '127.0.0.1',
          userAgent: 'jest',
        }),
      });
    });

    it('stores null for optional fields when not provided', async () => {
      prismaMock.auditLog.create.mockResolvedValue({});
      await repo.create({
        tenantId: 't-1',
        action: AuditAction.DELETE,
        entityType: 'cases',
        entityId: 'c-1',
      });
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorUserId: null,
          ipAddress: null,
          userAgent: null,
        }),
      });
    });
  });

  describe('createLoginAudit', () => {
    it('creates a login audit record with all fields', async () => {
      prismaMock.loginAudit.create.mockResolvedValue({});
      await repo.createLoginAudit({
        tenantId: 't-1',
        userId: 'u-1',
        identifier: 'user@example.com',
        authMethod: 'PASSWORD' as AuthMethod,
        status: 'SUCCESS' as LoginAuditStatus,
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
        deviceInfo: { browser: 'Chrome' },
      });

      expect(prismaMock.loginAudit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 't-1',
          userId: 'u-1',
          identifier: 'user@example.com',
          authMethod: 'PASSWORD',
          status: 'SUCCESS',
          ipAddress: '127.0.0.1',
          userAgent: 'jest',
          deviceInfo: { browser: 'Chrome' },
        }),
      });
    });
  });
});
