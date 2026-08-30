import { Test, TestingModule } from '@nestjs/testing';
import { TestlabController } from '../controller/testlab.controller';
import { TestlabService } from '../service/testlab.service';

describe('TestlabController', () => {
  let controller: TestlabController;
  const service = {
    getHealth: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestlabController],
      providers: [
        {
          provide: TestlabService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<TestlabController>(TestlabController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns health from service', async () => {
    service.getHealth.mockResolvedValue({ status: 'ok' });

    await expect(controller.getHealth()).resolves.toEqual({ status: 'ok' });
  });
});
