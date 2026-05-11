import { Test, type TestingModule } from '@nestjs/testing';

import { AppController } from './app.controller';
import { AppService } from './app.service';

const mockAppService = {
  getHealth: jest.fn().mockReturnValue({ status: 'ok', service: 'restopsiq-api' }),
};

describe('AppController', (): void => {
  let controller: AppController;

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: mockAppService }],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('should be defined', (): void => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', (): void => {
    it('should return health status', (): void => {
      expect(controller.getHealth()).toEqual({ status: 'ok', service: 'restopsiq-api' });
    });

    it('should call AppService.getHealth once', (): void => {
      controller.getHealth();
      expect(mockAppService.getHealth).toHaveBeenCalledTimes(1);
    });

    it('should return whatever AppService.getHealth returns', (): void => {
      const mockResponse = { status: 'ok', service: 'restopsiq-api' };
      mockAppService.getHealth.mockReturnValueOnce(mockResponse);
      expect(controller.getHealth()).toBe(mockResponse);
    });

    it('should propagate errors thrown by AppService.getHealth', (): void => {
      mockAppService.getHealth.mockImplementationOnce((): never => {
        throw new Error('service unavailable');
      });
      expect((): void => {
        controller.getHealth();
      }).toThrow('service unavailable');
    });
  });
});
