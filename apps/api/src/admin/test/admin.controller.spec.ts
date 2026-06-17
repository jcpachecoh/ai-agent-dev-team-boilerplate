import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from '../controller/admin.controller';
import { AdminService } from '../service/admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  const service = {
    getHealth: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns health from service', async () => {
    service.getHealth.mockResolvedValue({ status: 'ok' });

    await expect(controller.getHealth()).resolves.toEqual({ status: 'ok' });
  });
});
