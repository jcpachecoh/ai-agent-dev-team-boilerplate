import { validateSupplierLogisticsInput } from '../supplier-logistics.validation';

describe('validateSupplierLogisticsInput', () => {
  it('accepts draft payloads without required fields', () => {
    const result = validateSupplierLogisticsInput({}, true);
    expect(result).toEqual({});
  });

  it('rejects OTHER delivery place without custom text', () => {
    expect(() =>
      validateSupplierLogisticsInput(
        {
          deliveryMode: 'SUPPLIER_DELIVERS',
          deliveryPlace: 'OTHER',
          deliveryDays: [1],
          leadTimeDays: 2,
          receptionResponsibleUserId: 'user-1',
          transportType: 'OWN',
        },
        false,
      ),
    ).toThrow('Indica el lugar de entrega personalizado');
  });

  it('rejects invalid time window order', () => {
    expect(() =>
      validateSupplierLogisticsInput(
        {
          deliveryMode: 'SUPPLIER_DELIVERS',
          deliveryPlace: 'PLANT',
          deliveryDays: [1],
          leadTimeDays: 2,
          receptionResponsibleUserId: 'user-1',
          transportType: 'OWN',
          timeWindowStart: '14:00',
          timeWindowEnd: '08:00',
        },
        false,
      ),
    ).toThrow('La hora fin debe ser posterior a la hora inicio');
  });
});
