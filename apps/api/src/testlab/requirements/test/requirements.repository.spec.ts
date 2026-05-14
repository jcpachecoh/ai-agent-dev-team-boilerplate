import { Test, TestingModule } from '@nestjs/testing';
import { RequirementsRepository } from '../repository/requirements.repository';
import { PrismaService } from '../../../prisma/prisma.service';

const prismaMock = {
  requirement: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

describe('RequirementsRepository', () => {
  let repository: RequirementsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequirementsRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<RequirementsRepository>(RequirementsRepository);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('queries requirement.findMany with projectId and createdAt desc order', async () => {
      prismaMock.requirement.findMany.mockResolvedValue([]);
      await repository.findAll('proj-1');
      expect(prismaMock.requirement.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('queries requirement.findFirst with id and projectId', async () => {
      prismaMock.requirement.findFirst.mockResolvedValue(null);
      await repository.findOne('proj-1', 'req-1');
      expect(prismaMock.requirement.findFirst).toHaveBeenCalledWith({
        where: { id: 'req-1', projectId: 'proj-1' },
      });
    });
  });

  describe('create', () => {
    it('calls requirement.create with provided data', async () => {
      const data = { title: 'User can log in', projectId: 'proj-1' };
      prismaMock.requirement.create.mockResolvedValue({ id: 'req-1', ...data });
      await repository.create(data as any);
      expect(prismaMock.requirement.create).toHaveBeenCalledWith({ data });
    });
  });
});
