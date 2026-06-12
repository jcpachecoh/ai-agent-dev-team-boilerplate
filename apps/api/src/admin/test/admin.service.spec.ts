import { Test, TestingModule } from '@nestjs/testing';
import { AdminRepository } from '../repository/admin.repository';
import { AdminService } from '../service/admin.service';

describe('AdminService', () => {
  let service: AdminService;
  const repository = {
    getHealth: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: AdminRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns health from repository', async () => {
    repository.getHealth.mockResolvedValue({ status: 'ok' });

    await expect(service.getHealth()).resolves.toEqual({ status: 'ok' });
  });
});
