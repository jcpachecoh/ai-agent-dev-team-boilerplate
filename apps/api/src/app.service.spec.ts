import { Test, type TestingModule } from '@nestjs/testing';

import { AppService } from './app.service';

describe('AppService', (): void => {
  let service: AppService;

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  describe('getHealth', (): void => {
    it('should return ok status with service name', (): void => {
      expect(service.getHealth()).toEqual({ status: 'ok', service: 'restopsiq-api' });
    });
  });
});
