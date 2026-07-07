import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsController } from '../controller/permissions.controller';

describe('PermissionsController', () => {
  let controller: PermissionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionsController],
    }).compile();

    controller = module.get<PermissionsController>(PermissionsController);
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });
});
