import { LaborClassification } from '@prisma/client';
import { resolveClasificacionFilter } from './clasificacion.util';

describe('resolveClasificacionFilter', () => {
  it('retorna undefined cuando no se provee clasificacion', () => {
    expect(resolveClasificacionFilter(undefined)).toBeUndefined();
  });

  it('retorna undefined para "todos" (sin filtro)', () => {
    expect(resolveClasificacionFilter('todos')).toBeUndefined();
  });

  it('mapea "administrativo" a [ADMINISTRATIVO]', () => {
    expect(resolveClasificacionFilter('administrativo')).toEqual([
      LaborClassification.ADMINISTRATIVO,
    ]);
  });

  it('mapea "operaciones" a [COCINA, SERVICIO]', () => {
    expect(resolveClasificacionFilter('operaciones')).toEqual([
      LaborClassification.COCINA,
      LaborClassification.SERVICIO,
    ]);
  });
});
