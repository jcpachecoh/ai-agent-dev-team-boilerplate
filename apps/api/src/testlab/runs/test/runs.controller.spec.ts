import { Test, TestingModule } from '@nestjs/testing';
import { RunsController } from '../controller/runs.controller';
import { RunsService } from '../service/runs.service';

const mockRun = {
  id: 'run-1',
  name: 'Sprint 1',
  description: null,
  planId: null,
  assignedToId: null,
  status: 'ACTIVE',
  createdById: 'user-sys',
  createdAt: new Date(),
  updatedAt: new Date(),
  closedAt: null,
};

const serviceMock = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
};

describe('RunsController', () => {
  let controller: RunsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RunsController],
      providers: [{ provide: RunsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<RunsController>(RunsController);
    jest.clearAllMocks();
  });

  it('findAll delegates to service', async () => {
    serviceMock.findAll.mockResolvedValue([mockRun]);
    const result = await controller.findAll('proj-1');
    expect(result).toEqual([mockRun]);
    expect(serviceMock.findAll).toHaveBeenCalledWith('proj-1');
  });

  it('findOne delegates to service', async () => {
    serviceMock.findOne.mockResolvedValue(mockRun);
    const result = await controller.findOne('proj-1', 'run-1');
    expect(result).toEqual(mockRun);
    expect(serviceMock.findOne).toHaveBeenCalledWith('proj-1', 'run-1');
  });

  it('create delegates to service', async () => {
    const dto = { name: 'Sprint 1' } as any;
    serviceMock.create.mockResolvedValue(mockRun);
    const result = await controller.create('proj-1', dto);
    expect(result).toEqual(mockRun);
    expect(serviceMock.create).toHaveBeenCalledWith('proj-1', dto);
  });
});
