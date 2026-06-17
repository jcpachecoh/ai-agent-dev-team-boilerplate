import { Test, TestingModule } from '@nestjs/testing';
import { AuditAction, AuthMethod, LoginAuditStatus } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AuditRepository } from '../repository/audit.repository';
import { PrismaService } from '../../prisma/prisma.service';

const p2003Error = new PrismaClientKnownRequestError('FK constraint failed', {
  code: 'P2003',
  clientVersion: '5.0.0',
});

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

    it('swallows P2003 foreign key errors without throwing', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      prismaMock.auditLog.create.mockRejectedValue(p2003Error);

      await expect(
        repo.create({
          tenantId: 't-1',
          action: AuditAction.CREATE,
          entityType: 'projects',
          entityId: 'proj-1',
        }),
      ).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalledWith(
        'AuditLog persistence failed: Foreign key constraint error (P2003)',
        expect.objectContaining({ tenantId: 't-1', action: AuditAction.CREATE }),
      );
      consoleSpy.mockRestore();
    });

    it('rethrows non-P2003 errors', async () => {
      prismaMock.auditLog.create.mockRejectedValue(new Error('database unavailable'));

      await expect(
        repo.create({
          tenantId: 't-1',
          action: AuditAction.CREATE,
          entityType: 'projects',
          entityId: 'proj-1',
        }),
      ).rejects.toThrow('database unavailable');
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

    it('swallows P2003 foreign key errors without throwing', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      prismaMock.loginAudit.create.mockRejectedValue(p2003Error);

      await expect(
        repo.createLoginAudit({
          tenantId: 't-1',
          identifier: 'user@example.com',
          authMethod: 'PASSWORD' as AuthMethod,
          status: 'FAILURE' as LoginAuditStatus,
        }),
      ).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalledWith(
        'LoginAudit persistence failed: Foreign key constraint error (P2003)',
        expect.objectContaining({ tenantId: 't-1', identifier: 'user@example.com' }),
      );
      consoleSpy.mockRestore();
    });

    it('rethrows non-P2003 errors', async () => {
      prismaMock.loginAudit.create.mockRejectedValue(new Error('database unavailable'));

      await expect(
        repo.createLoginAudit({
          tenantId: 't-1',
          identifier: 'user@example.com',
          authMethod: 'PASSWORD' as AuthMethod,
          status: 'FAILURE' as LoginAuditStatus,
        }),
      ).rejects.toThrow('database unavailable');
    });
  });
});
