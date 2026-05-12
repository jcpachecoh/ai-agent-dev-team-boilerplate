import { Test, TestingModule } from '@nestjs/testing';
import { RequirementsController } from '../controller/requirements.controller';
import { RequirementsService } from '../service/requirements.service';

const mockReq = {
  id: 'req-1',
  title: 'User can log in',
  description: null,
  externalId: 'REQ-001',
  projectId: 'proj-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const serviceMock = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
};

describe('RequirementsController', () => {
  let controller: RequirementsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequirementsController],
      providers: [{ provide: RequirementsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<RequirementsController>(RequirementsController);
    jest.clearAllMocks();
  });

  it('findAll delegates to service', async () => {
    serviceMock.findAll.mockResolvedValue([mockReq]);
    const result = await controller.findAll('proj-1');
    expect(result).toEqual([mockReq]);
    expect(serviceMock.findAll).toHaveBeenCalledWith('proj-1');
  });

  it('findOne delegates to service', async () => {
    serviceMock.findOne.mockResolvedValue(mockReq);
    const result = await controller.findOne('proj-1', 'req-1');
    expect(result).toEqual(mockReq);
    expect(serviceMock.findOne).toHaveBeenCalledWith('proj-1', 'req-1');
  });

  it('create delegates to service', async () => {
    const dto = { title: 'User can log in', externalId: 'REQ-001' } as any;
    serviceMock.create.mockResolvedValue(mockReq);
    const result = await controller.create('proj-1', dto);
    expect(result).toEqual(mockReq);
    expect(serviceMock.create).toHaveBeenCalledWith('proj-1', dto);
  });
});
