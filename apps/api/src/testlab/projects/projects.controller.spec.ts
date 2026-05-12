import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

const mockProject = {
  id: 'proj-1',
  name: 'Alpha',
  slug: 'alpha',
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const serviceMock = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
};

describe('ProjectsController', () => {
  let controller: ProjectsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [{ provide: ProjectsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    jest.clearAllMocks();
  });

  it('findAll delegates to service', async () => {
    serviceMock.findAll.mockResolvedValue([mockProject]);
    const result = await controller.findAll();
    expect(result).toEqual([mockProject]);
    expect(serviceMock.findAll).toHaveBeenCalledTimes(1);
  });

  it('findOne delegates to service with id', async () => {
    serviceMock.findOne.mockResolvedValue(mockProject);
    const result = await controller.findOne('proj-1');
    expect(result).toEqual(mockProject);
    expect(serviceMock.findOne).toHaveBeenCalledWith('proj-1');
  });

  it('create delegates to service with dto', async () => {
    const dto = { name: 'Alpha', slug: 'alpha' } as any;
    serviceMock.create.mockResolvedValue(mockProject);
    const result = await controller.create(dto);
    expect(result).toEqual(mockProject);
    expect(serviceMock.create).toHaveBeenCalledWith(dto);
  });
});
