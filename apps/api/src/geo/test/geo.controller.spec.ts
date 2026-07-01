import { Test, TestingModule } from '@nestjs/testing';
import { GeoRepository } from '../repository/geo.repository';
import { GeoController } from '../controller/geo.controller';
import { GeoService } from '../service/geo.service';

describe('GeoController', () => {
  let controller: GeoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeoController],
      providers: [
        GeoService,
        {
          provide: GeoRepository,
          useValue: {
            listDepartments: jest.fn().mockReturnValue([{ code: '11', name: 'Bogotá D.C.' }]),
            listCities: jest.fn().mockReturnValue(['Bogotá']),
          },
        },
      ],
    }).compile();

    controller = module.get(GeoController);
  });

  it('lista departamentos', () => {
    expect(controller.getDepartments()).toEqual([{ code: '11', name: 'Bogotá D.C.' }]);
  });
});
