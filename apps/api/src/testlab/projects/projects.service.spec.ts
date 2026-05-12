import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockProject = {
  id: 'proj-1',
  name: 'Alpha',
  slug: 'alpha',
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const prismaMock = {
  project: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns all projects ordered by createdAt desc', async () => {
      prismaMock.project.findMany.mockResolvedValue([mockProject]);
      const result = await service.findAll();
      expect(result).toEqual([mockProject]);
      expect(prismaMock.project.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
    });
  });

  describe('findOne', () => {
    it('returns project when found', async () => {
      prismaMock.project.findUnique.mockResolvedValue(mockProject);
      const result = await service.findOne('proj-1');
      expect(result).toEqual(mockProject);
    });

    it('throws NotFoundException when project does not exist', async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);
      await expect(service.findOne('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = { name: 'Alpha', slug: 'alpha', description: undefined };

    it('creates and returns the project when slug is unique', async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);
      prismaMock.project.create.mockResolvedValue(mockProject);
      const result = await service.create(dto as any);
      expect(result).toEqual(mockProject);
      expect(prismaMock.project.create).toHaveBeenCalledWith({ data: dto });
    });

    it('throws ConflictException when slug already exists', async () => {
      prismaMock.project.findUnique.mockResolvedValue(mockProject);
      await expect(service.create(dto as any)).rejects.toThrow(ConflictException);
    });
  });
});
