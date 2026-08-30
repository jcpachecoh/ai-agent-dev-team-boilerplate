import { NotFoundException } from '@nestjs/common';
import type { LaborLegalParameter } from '@prisma/client';

import { LegalParameterSnapshot } from '../service/legal-parameter-snapshot';

function makeRow(overrides: Partial<LaborLegalParameter> = {}): LaborLegalParameter {
  return {
    id: 'row-id',
    tenantId: null,
    tenantScope: 'GLOBAL',
    key: 'SMLV',
    value: 1423500 as unknown as LaborLegalParameter['value'],
    validFrom: new Date('2025-01-01T00:00:00.000Z'),
    validTo: null,
    source: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('LegalParameterSnapshot', () => {
  it('resuelve el valor global activo en la fecha dada', () => {
    // Arrange
    const snapshot = new LegalParameterSnapshot([makeRow({ value: 1423500 as never })], null);

    // Act
    const value = snapshot.numberAt('SMLV', new Date('2025-06-01T00:00:00.000Z'));

    // Assert
    expect(value).toBe(1423500);
  });

  it('prioriza el override del tenant sobre el valor global para la misma fecha', () => {
    // Arrange
    const rows = [
      makeRow({ id: 'global', value: 0.8 as never }),
      makeRow({
        id: 'tenant',
        tenantId: 'tenant-001',
        tenantScope: 'tenant-001',
        value: 0.99 as never,
      }),
    ];
    const snapshot = new LegalParameterSnapshot(rows, 'tenant-001');

    // Act
    const value = snapshot.numberAt('SMLV', new Date('2025-06-01T00:00:00.000Z'));

    // Assert
    expect(value).toBe(0.99);
  });

  it('cae al valor global si el tenant no tiene override activo en esa fecha', () => {
    const rows = [makeRow({ value: 0.8 as never })];
    const snapshot = new LegalParameterSnapshot(rows, 'tenant-without-override');

    const value = snapshot.numberAt('SMLV', new Date('2025-06-01T00:00:00.000Z'));

    expect(value).toBe(0.8);
  });

  it('elige la fila con validFrom más reciente cuando hay varias vigencias activas', () => {
    // Arrange — dos filas cuyo rango se solapa en la fecha de consulta (no debería pasar en
    // datos reales por la validación de traslapes del service, pero el snapshot debe ser robusto)
    const rows = [
      makeRow({ id: 'older', validFrom: new Date('2020-01-01T00:00:00.000Z'), value: 1 as never }),
      makeRow({ id: 'newer', validFrom: new Date('2024-01-01T00:00:00.000Z'), value: 2 as never }),
    ];
    const snapshot = new LegalParameterSnapshot(rows, null);

    const value = snapshot.numberAt('SMLV', new Date('2025-01-01T00:00:00.000Z'));

    expect(value).toBe(2);
  });

  it('lanza NotFoundException si no hay ninguna fila activa para la key/fecha', () => {
    const snapshot = new LegalParameterSnapshot([], null);

    expect(() => snapshot.numberAt('SMLV', new Date('2025-01-01T00:00:00.000Z'))).toThrow(
      NotFoundException,
    );
  });

  it('ignora filas fuera del rango de vigencia (validTo vencido)', () => {
    const rows = [
      makeRow({
        validFrom: new Date('2020-01-01T00:00:00.000Z'),
        validTo: new Date('2024-12-31T00:00:00.000Z'),
      }),
    ];
    const snapshot = new LegalParameterSnapshot(rows, null);

    expect(() => snapshot.numberAt('SMLV', new Date('2025-06-01T00:00:00.000Z'))).toThrow(
      NotFoundException,
    );
  });
});
