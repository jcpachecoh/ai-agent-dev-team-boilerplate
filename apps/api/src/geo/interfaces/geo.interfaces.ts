import type { ColombiaDepartment } from '../data/colombia-locations';

export interface IGeoRepository {
  listDepartments(): ColombiaDepartment[];
  listCities(departmentCode: string): string[];
}

export interface IGeoService {
  listDepartments(): ColombiaDepartment[];
  listCities(departmentCode: string): string[];
}
