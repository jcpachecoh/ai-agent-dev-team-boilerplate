import { Test, TestingModule } from '@nestjs/testing';
import { GenerationController } from '../controller/generation.controller';
import { GenerationService } from '../service/generation.service';

const serviceMock = {
  generate: jest.fn(),
  confirm: jest.fn(),
};

describe('GenerationController', () => {
  let controller: GenerationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenerationController],
      providers: [{ provide: GenerationService, useValue: serviceMock }],
    }).compile();
    controller = module.get<GenerationController>(GenerationController);
    jest.clearAllMocks();
  });

  it('generate delegates to service', async () => {
    serviceMock.generate.mockResolvedValue({ testCases: [], requirements: [] });
    const result = await controller.generate('proj-1', { issueKey: 'PROJ-1' } as any);
    expect(serviceMock.generate).toHaveBeenCalledWith('proj-1', 'PROJ-1');
    expect(result.testCases).toEqual([]);
  });

  it('confirm delegates to service', async () => {
    serviceMock.confirm.mockResolvedValue({ testCaseIds: ['tc-1'] });
    const req = { user: { sub: 'user-1' } } as any;
    const dto = { suiteId: 'suite-1', requirements: [], testCases: [] };
    await controller.confirm('proj-1', dto as any, req);
    expect(serviceMock.confirm).toHaveBeenCalledWith(
      'proj-1',
      'suite-1',
      'user-1',
      expect.any(Object),
    );
  });
});
