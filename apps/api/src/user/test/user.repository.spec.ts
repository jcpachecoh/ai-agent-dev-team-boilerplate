import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRepository } from '../repository/user.repository';

const globalUserId = '11111111-0000-0000-0000-000000000004';
const operationalUser = {
  id: 'dddddddd-0000-0000-0000-000000000004',
  userId: globalUserId,
  tenantId: 'palos-de-lena',
  role: 'OWNER',
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

  it('findById looks up OperationalUser by plant id', async () => {
    prismaMock.operationalUser.findUnique.mockResolvedValue(operationalUser);

    await expect(repository.findById(operationalUser.id)).resolves.toEqual(operationalUser);
    expect(prismaMock.operationalUser.findUnique).toHaveBeenCalledWith({
      where: { id: operationalUser.id },
    });
  });

  it('findByUserId looks up OperationalUser by global User id FK', async () => {
    prismaMock.operationalUser.findUnique.mockResolvedValue(operationalUser);

    await expect(repository.findByUserId(globalUserId)).resolves.toEqual(operationalUser);
    expect(prismaMock.operationalUser.findUnique).toHaveBeenCalledWith({
      where: { userId: globalUserId },
    });
  });

  it('updates operational users by plant id', async () => {
    prismaMock.operationalUser.update.mockResolvedValue({ ...operationalUser, sedeId: 'sede-1' });

    await expect(
      repository.updateProfile(operationalUser.id, { sedeId: 'sede-1' }),
    ).resolves.toEqual({
      ...operationalUser,
      sedeId: 'sede-1',
    });
    expect(prismaMock.operationalUser.update).toHaveBeenCalledWith({
      where: { id: operationalUser.id },
      data: { sedeId: 'sede-1' },
    });
  });
});
