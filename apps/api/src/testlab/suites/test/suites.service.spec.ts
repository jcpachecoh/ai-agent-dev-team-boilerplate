import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SuitesService } from '../service/suites.service';
import { SuitesRepository } from '../repository/suites.repository';

const mockSuite = {
  id: 'suite-1',
  name: 'Smoke Tests',
  description: null,
  projectId: 'proj-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const repoMock = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
};

describe('SuitesService', () => {
  let service: SuitesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SuitesService, { provide: SuitesRepository, useValue: repoMock }],
    }).compile();

    service = module.get<SuitesService>(SuitesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns suites for the given project', async () => {
      repoMock.findAll.mockResolvedValue([mockSuite]);
      const result = await service.findAll('proj-1');
      expect(result).toEqual([mockSuite]);
      expect(repoMock.findAll).toHaveBeenCalledWith('proj-1');
    });
  });

  describe('findOne', () => {
    it('returns suite when found', async () => {
      repoMock.findOne.mockResolvedValue(mockSuite);
      const result = await service.findOne('proj-1', 'suite-1');
      expect(result).toEqual(mockSuite);
    });

    it('throws NotFoundException when suite does not exist', async () => {
      repoMock.findOne.mockResolvedValue(null);
      await expect(service.findOne('proj-1', 'unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a suite scoped to the project', async () => {
      const dto = { name: 'Smoke Tests', description: undefined };
      repoMock.create.mockResolvedValue(mockSuite);
      const result = await service.create('proj-1', dto as any);
      expect(result).toEqual(mockSuite);
      expect(repoMock.create).toHaveBeenCalledWith({ ...dto, projectId: 'proj-1' });
    });
  });
});
