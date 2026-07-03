import { GeoService } from '../service/geo.service';
import { GeoRepository } from '../repository/geo.repository';

describe('GeoService', () => {
  it('delegates to repository', () => {
    const repository = {
      listDepartments: jest.fn().mockReturnValue([]),
      listCities: jest.fn().mockReturnValue(['Bogotá']),
    } as unknown as GeoRepository;
    const service = new GeoService(repository);

    expect(service.listDepartments()).toEqual([]);
    service.listCities('11');
    expect(repository.listCities).toHaveBeenCalledWith('11');
  });
});
