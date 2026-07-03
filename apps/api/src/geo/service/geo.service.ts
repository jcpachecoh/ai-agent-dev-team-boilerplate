import { Injectable } from '@nestjs/common';
import type { IGeoService } from '../interfaces/geo.interfaces';
import { GeoRepository } from '../repository/geo.repository';

@Injectable()
export class GeoService implements IGeoService {
  constructor(private readonly repository: GeoRepository) {}

  listDepartments() {
    return this.repository.listDepartments();
  }

  listCities(departmentCode: string) {
    return this.repository.listCities(departmentCode);
  }
}
