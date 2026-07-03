import { Injectable } from '@nestjs/common';
import { listColombiaCities, listColombiaDepartments } from '../data/colombia-locations';
import type { IGeoRepository } from '../interfaces/geo.interfaces';

@Injectable()
export class GeoRepository implements IGeoRepository {
  listDepartments() {
    return listColombiaDepartments();
  }

  listCities(departmentCode: string) {
    return listColombiaCities(departmentCode);
  }
}
