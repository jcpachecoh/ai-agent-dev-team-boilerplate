import { Test, TestingModule } from '@nestjs/testing';
import { MilestonesRepository } from '../repository/milestones.repository';
import { PrismaService } from '../../../prisma/prisma.service';

const prismaMock = {
  milestone: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

describe('MilestonesRepository', () => {
  let repository: MilestonesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MilestonesRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<MilestonesRepository>(MilestonesRepository);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('queries milestone.findMany with projectId and dueDate asc order', async () => {
      prismaMock.milestone.findMany.mockResolvedValue([]);
      await repository.findAll('proj-1');
      expect(prismaMock.milestone.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
        orderBy: { dueDate: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('queries milestone.findFirst with id and projectId', async () => {
      prismaMock.milestone.findFirst.mockResolvedValue(null);
      await repository.findOne('proj-1', 'ms-1');
      expect(prismaMock.milestone.findFirst).toHaveBeenCalledWith({
        where: { id: 'ms-1', projectId: 'proj-1' },
      });
    });
  });

  describe('create', () => {
    it('calls milestone.create with provided data', async () => {
      const data = { name: 'v1.0', projectId: 'proj-1', dueDate: new Date('2026-06-01') };
      prismaMock.milestone.create.mockResolvedValue({ id: 'ms-1', ...data });
      await repository.create(data as any);
      expect(prismaMock.milestone.create).toHaveBeenCalledWith({ data });
    });
  });
});
