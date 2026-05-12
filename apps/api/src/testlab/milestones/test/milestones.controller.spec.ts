import { Test, TestingModule } from '@nestjs/testing';
import { MilestonesController } from '../controller/milestones.controller';
import { MilestonesService } from '../service/milestones.service';

const mockMilestone = {
  id: 'ms-1',
  name: 'v1.0 Launch',
  description: null,
  dueDate: new Date('2026-06-01'),
  projectId: 'proj-1',
  completed: false,
  completedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const serviceMock = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
};

describe('MilestonesController', () => {
  let controller: MilestonesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MilestonesController],
      providers: [{ provide: MilestonesService, useValue: serviceMock }],
    }).compile();

    controller = module.get<MilestonesController>(MilestonesController);
    jest.clearAllMocks();
  });

  it('findAll delegates to service', async () => {
    serviceMock.findAll.mockResolvedValue([mockMilestone]);
    const result = await controller.findAll('proj-1');
    expect(result).toEqual([mockMilestone]);
    expect(serviceMock.findAll).toHaveBeenCalledWith('proj-1');
  });

  it('findOne delegates to service', async () => {
    serviceMock.findOne.mockResolvedValue(mockMilestone);
    const result = await controller.findOne('proj-1', 'ms-1');
    expect(result).toEqual(mockMilestone);
    expect(serviceMock.findOne).toHaveBeenCalledWith('proj-1', 'ms-1');
  });

  it('create delegates to service', async () => {
    const dto = { name: 'v1.0 Launch', dueDate: '2026-06-01' } as any;
    serviceMock.create.mockResolvedValue(mockMilestone);
    const result = await controller.create('proj-1', dto);
    expect(result).toEqual(mockMilestone);
    expect(serviceMock.create).toHaveBeenCalledWith('proj-1', dto);
  });
});
