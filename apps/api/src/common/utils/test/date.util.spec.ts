import { calculateAge } from '../date.util';

describe('calculateAge', () => {
  it('calcula la edad cuando el cumpleaños ya pasó este año', () => {
    expect(calculateAge(new Date('2000-01-15'), new Date('2026-06-01'))).toBe(26);
  });

  it('resta un año cuando el mes de nacimiento aún no llega este año', () => {
    expect(calculateAge(new Date('2000-12-15'), new Date('2026-06-01'))).toBe(25);
  });

  it('resta un año cuando es el mismo mes pero el día aún no llega', () => {
    expect(calculateAge(new Date('2000-06-20'), new Date('2026-06-01'))).toBe(25);
  });

  it('no resta un año cuando es exactamente el día de cumpleaños', () => {
    expect(calculateAge(new Date('2000-06-01'), new Date('2026-06-01'))).toBe(26);
  });

  it('no resta un año cuando el día de cumpleaños ya pasó dentro del mismo mes', () => {
    expect(calculateAge(new Date('2000-06-01'), new Date('2026-06-20'))).toBe(26);
  });

  it('nunca retorna un valor negativo', () => {
    const futureBirthDate = new Date('2027-01-01');
    expect(calculateAge(futureBirthDate, new Date('2026-06-01'))).toBe(0);
  });

  it('usa la fecha actual como referencia por defecto', () => {
    const now = new Date();
    const twentyYearsAgo = new Date(now.getFullYear() - 20, now.getMonth(), now.getDate());
    expect(calculateAge(twentyYearsAgo)).toBe(20);
  });
});
