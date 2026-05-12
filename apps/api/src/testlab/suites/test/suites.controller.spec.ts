import { Test, TestingModule } from '@nestjs/testing';
import { SuitesController } from '../controller/suites.controller';
import { SuitesService } from '../service/suites.service';

const mockSuite = {
  id: 'suite-1',
  name: 'Smoke Tests',
  description: null,
  projectId: 'proj-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const serviceMock = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
};

describe('SuitesController', () => {
  let controller: SuitesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuitesController],
      providers: [{ provide: SuitesService, useValue: serviceMock }],
    }).compile();

    controller = module.get<SuitesController>(SuitesController);
    jest.clearAllMocks();
  });

  it('findAll delegates to service with projectId', async () => {
    serviceMock.findAll.mockResolvedValue([mockSuite]);
    const result = await controller.findAll('proj-1');
    expect(result).toEqual([mockSuite]);
    expect(serviceMock.findAll).toHaveBeenCalledWith('proj-1');
  });

  it('findOne delegates to service with projectId and id', async () => {
    serviceMock.findOne.mockResolvedValue(mockSuite);
    const result = await controller.findOne('proj-1', 'suite-1');
    expect(result).toEqual(mockSuite);
    expect(serviceMock.findOne).toHaveBeenCalledWith('proj-1', 'suite-1');
  });

  it('create delegates to service', async () => {
    const dto = { name: 'Smoke Tests' } as any;
    serviceMock.create.mockResolvedValue(mockSuite);
    const result = await controller.create('proj-1', dto);
    expect(result).toEqual(mockSuite);
    expect(serviceMock.create).toHaveBeenCalledWith('proj-1', dto);
  });
});
