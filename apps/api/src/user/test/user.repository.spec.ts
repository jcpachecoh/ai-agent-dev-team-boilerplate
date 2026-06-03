import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRepository } from '../repository/user.repository';

const user = {
  id: 'user-1',
  tenantId: 'tenant-1',
  email: 'ops@example.com',
  passwordHash: 'hash',
  roleId: 'role-1',
  sedeId: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const prismaMock = {
  operationalUser: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('UserRepository', () => {
  let repository: UserRepository;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    repository = module.get(UserRepository);
  });

  it('finds and updates operational users', async () => {
    prismaMock.operationalUser.findUnique.mockResolvedValue(user);
    prismaMock.operationalUser.update.mockResolvedValue({ ...user, sedeId: 'sede-1' });

    await expect(repository.findById('user-1')).resolves.toEqual(user);
    await expect(repository.updateProfile('user-1', { sedeId: 'sede-1' })).resolves.toEqual({
      ...user,
      sedeId: 'sede-1',
    });
  });
});
