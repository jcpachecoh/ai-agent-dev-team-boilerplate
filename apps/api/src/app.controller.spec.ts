import { Test, TestingModule } from '@nestjs/testing';

import { AppController } from './app.controller';
import { AppService } from './app.service';

const mockAppService = {
  getHealth: jest.fn().mockReturnValue({ status: 'ok', service: 'restopsiq-api' }),
};

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: mockAppService }],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health status from /health alias', () => {
      expect(controller.getHealthAlias()).toEqual({ status: 'ok', service: 'restopsiq-api' });
    });

    it('should return health status', () => {
      expect(controller.getHealth()).toEqual({ status: 'ok', service: 'restopsiq-api' });
    });

    it('should call AppService.getHealth once', () => {
      controller.getHealth();
      expect(mockAppService.getHealth).toHaveBeenCalledTimes(1);
    });

    it('should return whatever AppService.getHealth returns', () => {
      const mockResponse = { status: 'ok', service: 'restopsiq-api' };
      mockAppService.getHealth.mockReturnValueOnce(mockResponse);
      expect(controller.getHealth()).toBe(mockResponse);
    });

    it('should propagate errors thrown by AppService.getHealth', () => {
      mockAppService.getHealth.mockImplementationOnce(() => {
        throw new Error('service unavailable');
      });
      expect(() => controller.getHealth()).toThrow('service unavailable');
    });
  });
});
