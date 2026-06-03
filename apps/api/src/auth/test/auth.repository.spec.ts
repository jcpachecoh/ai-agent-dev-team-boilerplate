import { DocumentType } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthRepository } from '../repository/auth.repository';
import { PrismaService } from '../../prisma/prisma.service';

const mockUserSafe = {
  id: 'user-1',
  tenantId: 'palos-de-lena',
  cedula: '12345678',
  documentType: DocumentType.CC,
  email: 'test@example.com',
  roleId: 'role-1',
  loginAttempts: 0,
  lockedUntil: null,
  lastLoginAt: null,
  passwordChangedAt: null,
  isActive: true,
  emailVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  createdBy: null,
};

const mockUserWithPassword = {
  ...mockUserSafe,
  passwordHash: 'hashed',
};

const mockUserWithRefresh = {
  ...mockUserSafe,
  refreshToken: 'hashed-refresh',
};

const mockRole = {
  id: 'role-1',
  code: 'OPERATOR',
  isActive: true,
};

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  role: {
    findUnique: jest.fn(),
  },
};

describe('AuthRepository', () => {
  let repository: AuthRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<AuthRepository>(AuthRepository);
    jest.clearAllMocks();
  });

  describe('findByTenantAndEmail', () => {
    it('returns safe user when found without passwordHash or refreshToken', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUserSafe);
      const result = await repository.findByTenantAndEmail('palos-de-lena', 'test@example.com');
      expect(result).toEqual(mockUserSafe);
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('refreshToken');
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { tenantId_email: { tenantId: 'palos-de-lena', email: 'test@example.com' } },
        select: expect.not.objectContaining({
          passwordHash: expect.anything(),
          refreshToken: expect.anything(),
        }),
      });
    });

    it('returns null when not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const result = await repository.findByTenantAndEmail('palos-de-lena', 'nobody@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findByTenantAndEmailForAuth', () => {
    it('returns user with passwordHash for login', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUserWithPassword);
      const result = await repository.findByTenantAndEmailForAuth(
        'palos-de-lena',
        'test@example.com',
      );
      expect(result).toEqual(mockUserWithPassword);
      expect(result).toHaveProperty('passwordHash', 'hashed');
      expect(result).not.toHaveProperty('refreshToken');
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { tenantId_email: { tenantId: 'palos-de-lena', email: 'test@example.com' } },
        select: expect.objectContaining({ passwordHash: true }),
      });
    });
  });

  describe('findByTenantAndCedula', () => {
    it('returns safe user when found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUserSafe);
      const result = await repository.findByTenantAndCedula('palos-de-lena', '12345678');
      expect(result).toEqual(mockUserSafe);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { tenantId_cedula: { tenantId: 'palos-de-lena', cedula: '12345678' } },
        select: expect.any(Object),
      });
    });
  });

  describe('findByIdForAuth', () => {
    it('returns user with passwordHash for credential checks', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUserWithPassword);
      const result = await repository.findByIdForAuth('user-1');

      expect(result).toEqual(mockUserWithPassword);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: expect.objectContaining({ passwordHash: true }),
      });
    });
  });

  describe('findByIdWithRoleCode', () => {
    it('returns profile when user is active', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        tenantId: 'palos-de-lena',
        email: 'test@example.com',
        cedula: '12345678',
        documentType: DocumentType.CC,
        emailVerified: false,
        isActive: true,
        createdAt: mockUserSafe.createdAt,
        deletedAt: null,
        role: { code: 'OPERATOR' },
      });

      await expect(repository.findByIdWithRoleCode('user-1')).resolves.toEqual({
        id: 'user-1',
        tenantId: 'palos-de-lena',
        email: 'test@example.com',
        cedula: '12345678',
        documentType: DocumentType.CC,
        emailVerified: false,
        isActive: true,
        createdAt: mockUserSafe.createdAt,
        roleCode: 'OPERATOR',
      });
    });

    it('returns null when user is soft-deleted', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUserSafe,
        deletedAt: new Date(),
        role: { code: 'OPERATOR' },
      });

      await expect(repository.findByIdWithRoleCode('user-1')).resolves.toBeNull();
    });
  });

  describe('findByIdForRefresh', () => {
    it('returns user with refreshToken for refresh flow', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUserWithRefresh);
      const result = await repository.findByIdForRefresh('user-1');
      expect(result).toEqual(mockUserWithRefresh);
      expect(result).toHaveProperty('refreshToken', 'hashed-refresh');
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('findRoleByTenantAndCode', () => {
    it('returns role reference when found', async () => {
      prismaMock.role.findUnique.mockResolvedValue(mockRole);
      const result = await repository.findRoleByTenantAndCode('palos-de-lena', 'OPERATOR');
      expect(result).toEqual(mockRole);
      expect(prismaMock.role.findUnique).toHaveBeenCalledWith({
        where: { tenantId_code: { tenantId: 'palos-de-lena', code: 'OPERATOR' } },
        select: { id: true, code: true, isActive: true },
      });
    });
  });

  describe('createUser', () => {
    it('creates and returns safe user without secrets', async () => {
      prismaMock.user.create.mockResolvedValue(mockUserSafe);
      const data = {
        tenantId: 'palos-de-lena',
        cedula: '12345678',
        documentType: DocumentType.CC,
        email: 'test@example.com',
        passwordHash: 'hashed',
        roleId: 'role-1',
      };
      const result = await repository.createUser(data);
      expect(result).toEqual(mockUserSafe);
      expect(result).not.toHaveProperty('passwordHash');
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          ...data,
          isActive: true,
          emailVerified: false,
        },
        select: expect.any(Object),
      });
    });
  });

  describe('saveRefreshToken', () => {
    it('updates user with hashed refresh token', async () => {
      prismaMock.user.update.mockResolvedValue(mockUserSafe);
      await repository.saveRefreshToken('user-1', 'hashed-refresh');
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { refreshToken: 'hashed-refresh' },
      });
    });

    it('clears refresh token when null passed', async () => {
      prismaMock.user.update.mockResolvedValue(mockUserSafe);
      await repository.saveRefreshToken('user-1', null);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { refreshToken: null },
      });
    });
  });

  describe('updatePassword', () => {
    it('updates user password hash', async () => {
      prismaMock.user.update.mockResolvedValue(mockUserSafe);
      await repository.updatePassword('user-1', 'new-hash');
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: 'new-hash' },
      });
    });
  });
});
