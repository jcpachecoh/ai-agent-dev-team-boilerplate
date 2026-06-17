import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from '../controller/audit.controller';

describe('AuditController', () => {
  let controller: AuditController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
    }).compile();

    controller = module.get<AuditController>(AuditController);
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });
});
