import { Test, TestingModule } from '@nestjs/testing';
import { SuitesRepository } from '../repository/suites.repository';
import { PrismaService } from '../../../prisma/prisma.service';

const prismaMock = {
  testSuite: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

describe('SuitesRepository', () => {
  let repository: SuitesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SuitesRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<SuitesRepository>(SuitesRepository);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('queries testSuite.findMany with projectId and createdAt desc order', async () => {
      prismaMock.testSuite.findMany.mockResolvedValue([]);
      await repository.findAll('proj-1');
      expect(prismaMock.testSuite.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('queries testSuite.findFirst with id and projectId', async () => {
      prismaMock.testSuite.findFirst.mockResolvedValue(null);
      await repository.findOne('proj-1', 'suite-1');
      expect(prismaMock.testSuite.findFirst).toHaveBeenCalledWith({
        where: { id: 'suite-1', projectId: 'proj-1' },
      });
    });
  });

  describe('create', () => {
    it('calls testSuite.create with provided data', async () => {
      const data = { name: 'Smoke Tests', projectId: 'proj-1' };
      prismaMock.testSuite.create.mockResolvedValue({ id: 'suite-1', ...data });
      await repository.create(data as any);
      expect(prismaMock.testSuite.create).toHaveBeenCalledWith({ data });
    });
  });
});
