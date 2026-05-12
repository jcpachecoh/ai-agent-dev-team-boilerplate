import { Test, TestingModule } from '@nestjs/testing';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { ResultStatus } from './dto/update-case-status.dto';

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

const serviceMock = {
  findAll: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
};

describe('CasesController', () => {
  let controller: CasesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CasesController],
      providers: [{ provide: CasesService, useValue: serviceMock }],
    }).compile();

    controller = module.get<CasesController>(CasesController);
    jest.clearAllMocks();
  });

  it('findAll delegates to service with suiteId', async () => {
    serviceMock.findAll.mockResolvedValue([mockCase]);
    const result = await controller.findAll('suite-1');
    expect(result).toEqual([mockCase]);
    expect(serviceMock.findAll).toHaveBeenCalledWith('suite-1');
  });

  it('create delegates to service', async () => {
    const dto = { title: 'Login with valid credentials' } as any;
    serviceMock.create.mockResolvedValue(mockCase);
    const result = await controller.create('suite-1', dto);
    expect(result).toEqual(mockCase);
    expect(serviceMock.create).toHaveBeenCalledWith('suite-1', dto);
  });

  it('updateStatus delegates to service', async () => {
    const dto = { status: ResultStatus.PASS };
    serviceMock.updateStatus.mockResolvedValue({ ...mockCase, status: 'PASS' });
    const result = await controller.updateStatus('suite-1', 'case-1', dto);
    expect(result.status).toBe('PASS');
    expect(serviceMock.updateStatus).toHaveBeenCalledWith('suite-1', 'case-1', dto);
  });
});
