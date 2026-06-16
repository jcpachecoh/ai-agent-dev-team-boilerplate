import { Test, TestingModule } from '@nestjs/testing';
import { AuthEmailRepository } from '../repository/auth-email.repository';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateResetTokenData } from '../interfaces/auth.interfaces';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockToken = {
  id: 'token-001',
  tenantId: 'tenant-abc',
  userId: 'user-001',
  tokenHash: 'sha256-hash-abc',
  expiresAt: new Date('2026-06-01T00:00:00.000Z'),
  usedAt: null,
  createdAt: new Date('2026-05-21T00:00:00.000Z'),
};

const prismaMock = {
  passwordResetToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthEmailRepository', () => {
  let repository: AuthEmailRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthEmailRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<AuthEmailRepository>(AuthEmailRepository);
    jest.clearAllMocks();
  });

  // ── createResetToken ────────────────────────────────────────────────────

  describe('createResetToken', () => {
    it('calls prisma.passwordResetToken.create with the provided data', async () => {
      prismaMock.passwordResetToken.create.mockResolvedValue(mockToken);

      const data: CreateResetTokenData = {
        tenantId: 'tenant-abc',
        userId: 'user-001',
        tokenHash: 'sha256-hash-abc',
        expiresAt: mockToken.expiresAt,
      };

      const result = await repository.createResetToken(data);

      expect(prismaMock.passwordResetToken.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.passwordResetToken.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual(mockToken);
    });
  });

  // ── findResetToken ──────────────────────────────────────────────────────

  describe('findResetToken', () => {
    it('returns the token when found by hash', async () => {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue(mockToken);

      const result = await repository.findResetToken('sha256-hash-abc');

      expect(prismaMock.passwordResetToken.findUnique).toHaveBeenCalledWith({
        where: { tokenHash: 'sha256-hash-abc' },
      });
      expect(result).toEqual(mockToken);
    });

    it('returns null when token is not found', async () => {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue(null);

      const result = await repository.findResetToken('nonexistent-hash');

      expect(result).toBeNull();
    });
  });

  // ── markResetTokenUsed ──────────────────────────────────────────────────

  describe('markResetTokenUsed', () => {
    it('calls prisma.passwordResetToken.update with usedAt set to a Date', async () => {
      prismaMock.passwordResetToken.update.mockResolvedValue({
        ...mockToken,
        usedAt: new Date(),
      });

      await repository.markResetTokenUsed('token-001');

      expect(prismaMock.passwordResetToken.update).toHaveBeenCalledTimes(1);
      expect(prismaMock.passwordResetToken.update).toHaveBeenCalledWith({
        where: { id: 'token-001' },
        data: { usedAt: expect.any(Date) },
      });
    });

    it('resolves without returning a value', async () => {
      prismaMock.passwordResetToken.update.mockResolvedValue({ ...mockToken, usedAt: new Date() });

      const result = await repository.markResetTokenUsed('token-001');

      expect(result).toBeUndefined();
    });
  });

  // ── deleteExpiredResetTokens ────────────────────────────────────────────

  describe('deleteExpiredResetTokens', () => {
    it('calls deleteMany with userId and correct OR clause', async () => {
      prismaMock.passwordResetToken.deleteMany.mockResolvedValue({ count: 2 });

      await repository.deleteExpiredResetTokens('user-001');

      expect(prismaMock.passwordResetToken.deleteMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-001',
          OR: [{ expiresAt: { lt: expect.any(Date) } }, { usedAt: { not: null } }],
        },
      });
    });

    it('resolves without returning a value', async () => {
      prismaMock.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 });

      const result = await repository.deleteExpiredResetTokens('user-001');

      expect(result).toBeUndefined();
    });
  });
});
