import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RequirementsService } from './requirements.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockReq = {
  id: 'req-1',
  title: 'User can log in',
  description: null,
  externalId: 'REQ-001',
  projectId: 'proj-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const prismaMock = {
  requirement: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

describe('RequirementsService', () => {
  let service: RequirementsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequirementsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<RequirementsService>(RequirementsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns requirements for project ordered by createdAt desc', async () => {
      prismaMock.requirement.findMany.mockResolvedValue([mockReq]);
      const result = await service.findAll('proj-1');
      expect(result).toEqual([mockReq]);
      expect(prismaMock.requirement.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('returns requirement when found', async () => {
      prismaMock.requirement.findFirst.mockResolvedValue(mockReq);
      const result = await service.findOne('proj-1', 'req-1');
      expect(result).toEqual(mockReq);
    });

    it('throws NotFoundException when not found', async () => {
      prismaMock.requirement.findFirst.mockResolvedValue(null);
      await expect(service.findOne('proj-1', 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates requirement scoped to project', async () => {
      const dto = { title: 'User can log in', externalId: 'REQ-001' };
      prismaMock.requirement.create.mockResolvedValue(mockReq);
      const result = await service.create('proj-1', dto as any);
      expect(result).toEqual(mockReq);
      expect(prismaMock.requirement.create).toHaveBeenCalledWith({
        data: { ...dto, projectId: 'proj-1' },
      });
    });
  });
});
