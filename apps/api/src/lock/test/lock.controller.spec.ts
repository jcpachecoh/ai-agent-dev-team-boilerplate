import { Test, TestingModule } from '@nestjs/testing';
import { LockController } from '../controller/lock.controller';
import { LockService } from '../service/lock.service';

describe('LockController', () => {
  let controller: LockController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LockController],
      providers: [{ provide: LockService, useValue: {} }],
    }).compile();

    controller = module.get<LockController>(LockController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
