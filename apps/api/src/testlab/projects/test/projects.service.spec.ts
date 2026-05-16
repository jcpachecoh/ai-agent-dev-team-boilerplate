import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from '../service/projects.service';
import { ProjectsRepository } from '../repository/projects.repository';

const mockProject = {
  id: 'proj-1',
  name: 'Alpha',
  slug: 'alpha',
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const repoMock = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  create: jest.fn(),
};

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectsService, { provide: ProjectsRepository, useValue: repoMock }],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns all projects', async () => {
      repoMock.findAll.mockResolvedValue([mockProject]);
      const result = await service.findAll();
      expect(result).toEqual([mockProject]);
      expect(repoMock.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('returns project when found', async () => {
      repoMock.findById.mockResolvedValue(mockProject);
      const result = await service.findOne('proj-1');
      expect(result).toEqual(mockProject);
      expect(repoMock.findById).toHaveBeenCalledWith('proj-1');
    });

    it('throws NotFoundException when project does not exist', async () => {
      repoMock.findById.mockResolvedValue(null);
      await expect(service.findOne('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = { name: 'Alpha', slug: 'alpha', description: undefined };

    it('creates and returns the project when slug is unique', async () => {
      repoMock.findBySlug.mockResolvedValue(null);
      repoMock.create.mockResolvedValue(mockProject);
      const result = await service.create(dto as any);
      expect(result).toEqual(mockProject);
      expect(repoMock.create).toHaveBeenCalledWith(dto);
    });

    it('throws ConflictException when slug already exists', async () => {
      repoMock.findBySlug.mockResolvedValue(mockProject);
      await expect(service.create(dto as any)).rejects.toThrow(ConflictException);
    });
  });
});
