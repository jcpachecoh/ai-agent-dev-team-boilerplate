import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RequirementsService } from '../service/requirements.service';
import { RequirementsRepository } from '../repository/requirements.repository';

const mockReq = {
  id: 'req-1',
  title: 'User can log in',
  description: null,
  externalId: 'REQ-001',
  projectId: 'proj-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const repoMock = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findCases: jest.fn(),
};

const mockCase = {
  id: 'case-1',
  title: 'Login works',
  priority: 'MEDIUM',
  type: 'FUNCTIONAL',
  status: 'UNTESTED',
  preconditions: null,
  expectedResult: null,
  sectionId: null,
  suiteId: 'suite-1',
  createdById: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('RequirementsService', () => {
  let service: RequirementsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequirementsService, { provide: RequirementsRepository, useValue: repoMock }],
    }).compile();

    service = module.get<RequirementsService>(RequirementsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns requirements for project', async () => {
      repoMock.findAll.mockResolvedValue([mockReq]);
      const result = await service.findAll('proj-1');
      expect(result).toEqual([mockReq]);
      expect(repoMock.findAll).toHaveBeenCalledWith('proj-1');
    });
  });

  describe('findOne', () => {
    it('returns requirement when found', async () => {
      repoMock.findOne.mockResolvedValue(mockReq);
      const result = await service.findOne('proj-1', 'req-1');
      expect(result).toEqual(mockReq);
    });

    it('throws NotFoundException when not found', async () => {
      repoMock.findOne.mockResolvedValue(null);
      await expect(service.findOne('proj-1', 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates requirement scoped to project', async () => {
      const dto = { title: 'User can log in', externalId: 'REQ-001' };
      repoMock.create.mockResolvedValue(mockReq);
      const result = await service.create('proj-1', dto as any);
      expect(result).toEqual(mockReq);
      expect(repoMock.create).toHaveBeenCalledWith({ ...dto, projectId: 'proj-1' });
    });
  });

  describe('findCases', () => {
    it('returns linked test cases when requirement exists', async () => {
      repoMock.findOne.mockResolvedValue(mockReq);
      repoMock.findCases.mockResolvedValue([mockCase]);
      const result = await service.findCases('proj-1', 'req-1');
      expect(result).toEqual([mockCase]);
      expect(repoMock.findCases).toHaveBeenCalledWith('proj-1', 'req-1');
    });

    it('throws NotFoundException when requirement does not exist', async () => {
      repoMock.findOne.mockResolvedValue(null);
      await expect(service.findCases('proj-1', 'missing')).rejects.toThrow(NotFoundException);
      expect(repoMock.findCases).not.toHaveBeenCalled();
    });
  });
});
