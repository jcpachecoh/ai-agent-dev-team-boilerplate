import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsRepository } from '../repository/projects.repository';
import { PrismaService } from '../../../prisma/prisma.service';

const prismaMock = {
  project: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

describe('ProjectsRepository', () => {
  let repository: ProjectsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectsRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<ProjectsRepository>(ProjectsRepository);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('queries project.findMany ordered by createdAt desc', async () => {
      prismaMock.project.findMany.mockResolvedValue([]);
      await repository.findAll();
      expect(prismaMock.project.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findById', () => {
    it('queries project.findUnique by id', async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);
      await repository.findById('proj-1');
      expect(prismaMock.project.findUnique).toHaveBeenCalledWith({ where: { id: 'proj-1' } });
    });
  });

  describe('findBySlug', () => {
    it('queries project.findUnique by slug', async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);
      await repository.findBySlug('alpha');
      expect(prismaMock.project.findUnique).toHaveBeenCalledWith({ where: { slug: 'alpha' } });
    });
  });

  describe('create', () => {
    it('calls project.create with provided data', async () => {
      const data = { name: 'Alpha', slug: 'alpha' };
      prismaMock.project.create.mockResolvedValue({ id: 'proj-1', ...data });
      await repository.create(data as any);
      expect(prismaMock.project.create).toHaveBeenCalledWith({ data });
    });
  });
});
