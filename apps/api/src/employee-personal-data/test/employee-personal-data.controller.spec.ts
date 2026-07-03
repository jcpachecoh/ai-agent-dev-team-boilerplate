import { Test, TestingModule } from '@nestjs/testing';
import { EmployeePersonalDataController } from '../controller/employee-personal-data.controller';
import { EmployeePersonalDataService } from '../service/employee-personal-data.service';

describe('EmployeePersonalDataController', () => {
  let controller: EmployeePersonalDataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeePersonalDataController],
      providers: [
        {
          provide: EmployeePersonalDataService,
          useValue: {
            getByUserId: jest.fn(),
            updateByUserId: jest.fn(),
            uploadProfilePhoto: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(EmployeePersonalDataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
