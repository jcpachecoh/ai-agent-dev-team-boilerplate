import { Test, TestingModule } from '@nestjs/testing';
import { AuthRepository } from '../repository/auth.repository';
import { PrismaService } from '../../prisma/prisma.service';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  passwordHash: 'hashed',
  refreshToken: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
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

  describe('findByEmail', () => {
    it('returns user when found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      const result = await repository.findByEmail('test@example.com');
      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('returns null when not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const result = await repository.findByEmail('nobody@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns user when found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      const result = await repository.findById('user-1');
      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('returns null when not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const result = await repository.findById('unknown');
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('creates and returns user', async () => {
      prismaMock.user.create.mockResolvedValue(mockUser);
      const data = { email: 'test@example.com', name: 'Test User', passwordHash: 'hashed' };
      const result = await repository.createUser(data);
      expect(result).toEqual(mockUser);
      expect(prismaMock.user.create).toHaveBeenCalledWith({ data });
    });
  });

  describe('saveRefreshToken', () => {
    it('updates user with hashed refresh token', async () => {
      prismaMock.user.update.mockResolvedValue(mockUser);
      await repository.saveRefreshToken('user-1', 'hashed-refresh');
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { refreshToken: 'hashed-refresh' },
      });
    });

    it('clears refresh token when null passed', async () => {
      prismaMock.user.update.mockResolvedValue(mockUser);
      await repository.saveRefreshToken('user-1', null);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { refreshToken: null },
      });
    });
  });
});
