import { Test, TestingModule } from '@nestjs/testing';
import { AuditAction, AuthMethod, LoginAuditStatus } from '@prisma/client';
import { AuditService } from '../service/audit.service';
import { AuditRepository } from '../repository/audit.repository';

const repoMock = {
  create: jest.fn(),
  createLoginAudit: jest.fn(),
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
        tenantId: 't-1',
        action: AuditAction.CREATE,
        entityType: 'projects',
        entityId: 'proj-1',
        actorUserId: 'user-1',
        newValue: { name: 'Alpha' },
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      });
      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 't-1',
          action: AuditAction.CREATE,
          entityType: 'projects',
          entityId: 'proj-1',
          actorUserId: 'user-1',
          ipAddress: '127.0.0.1',
          userAgent: 'jest',
        }),
      );
    });

    it('redacts sensitive fields in payload, oldValue and newValue', async () => {
      repoMock.create.mockResolvedValue(undefined);
      await service.log({
        tenantId: 't-1',
        action: AuditAction.UPDATE,
        entityType: 'User',
        entityId: 'u-1',
        oldValue: { password: 'old-password', email: 'a@b.com' },
        newValue: { password: 'new-password', email: 'a@c.com', pinHash: '1234' },
      });

      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          oldValue: { password: '[REDACTED]', email: 'a@b.com' },
          newValue: { password: '[REDACTED]', email: 'a@c.com', pinHash: '[REDACTED]' },
        }),
      );
    });

    it('redacts fields recursively', async () => {
      repoMock.create.mockResolvedValue(undefined);
      await service.log({
        tenantId: 't-1',
        action: AuditAction.CREATE,
        entityType: 'Nested',
        entityId: 'n-1',
        payload: {
          user: {
            token: 'secret-token',
            profile: {
              passwordHash: 'hashed',
              name: 'John',
            },
          },
          items: [{ secret: 's1' }, { secret: 's2', public: 'p1' }],
        },
      });

      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: {
            user: {
              token: '[REDACTED]',
              profile: {
                passwordHash: '[REDACTED]',
                name: 'John',
              },
            },
            items: [{ secret: '[REDACTED]' }, { secret: '[REDACTED]', public: 'p1' }],
          },
        }),
      );
    });

    it('redacts fields ending in Hash, Token, Secret', async () => {
      repoMock.create.mockResolvedValue(undefined);
      await service.log({
        tenantId: 't-1',
        action: AuditAction.CREATE,
        entityType: 'Patterns',
        entityId: 'p-1',
        payload: {
          mySecret: 'val',
          someToken: 'val',
          legacyHash: 'val',
          normalField: 'val',
        },
      });

      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: {
            mySecret: '[REDACTED]',
            someToken: '[REDACTED]',
            legacyHash: '[REDACTED]',
            normalField: 'val',
          },
        }),
      );
    });
  });

  describe('logLogin', () => {
    it('delegates to repository.createLoginAudit and redacts deviceInfo', async () => {
      repoMock.createLoginAudit.mockResolvedValue(undefined);
      await service.logLogin({
        tenantId: 't-1',
        userId: 'u-1',
        identifier: 'user@example.com',
        authMethod: 'PASSWORD' as AuthMethod,
        status: 'SUCCESS' as LoginAuditStatus,
        deviceInfo: { browser: 'Chrome', sessionToken: 'secret' },
      });

      expect(repoMock.createLoginAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 't-1',
          identifier: 'user@example.com',
          status: 'SUCCESS',
          deviceInfo: { browser: 'Chrome', sessionToken: '[REDACTED]' },
        }),
      );
    });
  });
});
