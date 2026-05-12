import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CasesService } from '../service/cases.service';
import { CasesRepository } from '../repository/cases.repository';
import { ResultStatus } from '../controller/dto/update-case-status.dto';

const systemUser = { id: 'user-sys' };
const mockCase = {
  id: 'case-1',
  title: 'Login with valid credentials',
  priority: 'HIGH',
  type: 'FUNCTIONAL',
  status: 'UNTESTED',
  preconditions: null,
  expectedResult: null,
  sectionId: null,
  suiteId: 'suite-1',
  createdById: 'user-sys',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const repoMock = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
  findOrCreateSystemUser: jest.fn(),
};

describe('CasesService', () => {
  let service: CasesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CasesService, { provide: CasesRepository, useValue: repoMock }],
    }).compile();

    service = module.get<CasesService>(CasesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns test cases for suite', async () => {
      repoMock.findAll.mockResolvedValue([mockCase]);
      const result = await service.findAll('suite-1');
      expect(result).toEqual([mockCase]);
      expect(repoMock.findAll).toHaveBeenCalledWith('suite-1');
    });
  });

  describe('findOne', () => {
    it('returns test case when found', async () => {
      repoMock.findOne.mockResolvedValue(mockCase);
      const result = await service.findOne('suite-1', 'case-1');
      expect(result).toEqual(mockCase);
    });

    it('throws NotFoundException when not found', async () => {
      repoMock.findOne.mockResolvedValue(null);
      await expect(service.findOne('suite-1', 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('gets system user and creates test case with defaults', async () => {
      const dto = { title: 'Login with valid credentials' };
      repoMock.findOrCreateSystemUser.mockResolvedValue(systemUser);
      repoMock.create.mockResolvedValue(mockCase);

      const result = await service.create('suite-1', dto as any);
      expect(result).toEqual(mockCase);
      expect(repoMock.findOrCreateSystemUser).toHaveBeenCalled();
      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Login with valid credentials',
          priority: 'MEDIUM',
          type: 'FUNCTIONAL',
          suiteId: 'suite-1',
          createdById: 'user-sys',
        }),
      );
    });

    it('uses provided priority and type', async () => {
      const dto = { title: 'Login', priority: 'HIGH' as const, type: 'SMOKE' as const };
      repoMock.findOrCreateSystemUser.mockResolvedValue(systemUser);
      repoMock.create.mockResolvedValue({ ...mockCase, priority: 'HIGH', type: 'SMOKE' });

      await service.create('suite-1', dto as any);
      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 'HIGH', type: 'SMOKE' }),
      );
    });
  });

  describe('updateStatus', () => {
    it('updates status when case exists', async () => {
      repoMock.findOne.mockResolvedValue(mockCase);
      repoMock.updateStatus.mockResolvedValue({ ...mockCase, status: 'PASS' });

      const dto = { status: ResultStatus.PASS };
      const result = await service.updateStatus('suite-1', 'case-1', dto);
      expect(result.status).toBe('PASS');
      expect(repoMock.updateStatus).toHaveBeenCalledWith('case-1', ResultStatus.PASS);
    });

    it('throws NotFoundException when case does not exist', async () => {
      repoMock.findOne.mockResolvedValue(null);
      await expect(
        service.updateStatus('suite-1', 'bad', { status: ResultStatus.FAIL }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
