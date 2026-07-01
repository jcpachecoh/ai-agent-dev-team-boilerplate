import { GeoRepository } from '../repository/geo.repository';

describe('GeoRepository', () => {
  const repository = new GeoRepository();

  it('lista departamentos de Colombia', () => {
    const departments = repository.listDepartments();

    expect(departments.length).toBeGreaterThan(0);
    expect(departments).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: '11', name: 'Bogotá D.C.' })]),
    );
  });

  it('lista ciudades por departamento y retorna vacío si no existe', () => {
    expect(repository.listCities('11')).toEqual(['Bogotá']);
    expect(repository.listCities('99')).toEqual([]);
  });

  it('resuelve el nombre del departamento', async () => {
    const { resolveDepartmentName } = await import('../data/colombia-locations');

    expect(resolveDepartmentName('11')).toBe('Bogotá D.C.');
    expect(resolveDepartmentName('99')).toBeNull();
  });
});
