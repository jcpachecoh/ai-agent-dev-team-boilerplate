import { Test, TestingModule } from '@nestjs/testing';
import { TestlabRepository } from '../repository/testlab.repository';
import { TestlabService } from '../service/testlab.service';

describe('TestlabService', () => {
  let service: TestlabService;
  const repository = {
    getHealth: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestlabService,
        {
          provide: TestlabRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<TestlabService>(TestlabService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns health from repository', async () => {
    repository.getHealth.mockResolvedValue({ status: 'ok' });

    await expect(service.getHealth()).resolves.toEqual({ status: 'ok' });
  });
});
