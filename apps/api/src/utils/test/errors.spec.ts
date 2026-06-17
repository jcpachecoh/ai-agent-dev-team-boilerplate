import { ValidationError } from '../errors';

describe('ValidationError', () => {
  it('exposes message and field map', () => {
    const error = new ValidationError('Invalid input', { nit: ['too short'] });

    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Invalid input');
    expect(error.fields).toEqual({ nit: ['too short'] });
  });
});
