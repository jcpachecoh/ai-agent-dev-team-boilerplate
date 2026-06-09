import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { MesLoginDto } from '../controller/dto/mes-login.dto';

describe('MesLoginDto validation', () => {
  describe('valid inputs', () => {
    it('passes with 8-digit cedula and 4-digit pin', async () => {
      const dto = plainToInstance(MesLoginDto, { cedula: '12345678', pin: '1234' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('passes with 11-digit cedula and 6-digit pin', async () => {
      const dto = plainToInstance(MesLoginDto, { cedula: '12345678901', pin: '123456' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('passes with 10-digit cedula and 5-digit pin', async () => {
      const dto = plainToInstance(MesLoginDto, { cedula: '1234567890', pin: '12345' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('cedula validation', () => {
    it('fails when cedula contains a dot', async () => {
      const dto = plainToInstance(MesLoginDto, { cedula: '1.234.567', pin: '1234' });
      const errors = await validate(dto);
      const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
      expect(messages.some((m) => m.includes('cedula'))).toBe(true);
    });

    it('fails when cedula contains letters', async () => {
      const dto = plainToInstance(MesLoginDto, { cedula: '1234ABCD', pin: '1234' });
      const errors = await validate(dto);
      const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
      expect(messages.some((m) => m.includes('cedula'))).toBe(true);
    });

    it('fails when cedula contains spaces', async () => {
      const dto = plainToInstance(MesLoginDto, { cedula: '1234 5678', pin: '1234' });
      const errors = await validate(dto);
      const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
      expect(messages.some((m) => m.includes('cedula'))).toBe(true);
    });

    it('fails when cedula is shorter than 8 digits', async () => {
      const dto = plainToInstance(MesLoginDto, { cedula: '1234567', pin: '1234' });
      const errors = await validate(dto);
      const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
      expect(messages.some((m) => m.includes('cedula'))).toBe(true);
    });

    it('fails when cedula is longer than 11 digits', async () => {
      const dto = plainToInstance(MesLoginDto, { cedula: '123456789012', pin: '1234' });
      const errors = await validate(dto);
      const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
      expect(messages.some((m) => m.includes('cedula'))).toBe(true);
    });

    it('fails when cedula is an empty string', async () => {
      const dto = plainToInstance(MesLoginDto, { cedula: '', pin: '1234' });
      const errors = await validate(dto);
      const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
      expect(messages.some((m) => m.includes('cedula'))).toBe(true);
    });

    it('fails when cedula is missing', async () => {
      const dto = plainToInstance(MesLoginDto, { pin: '1234' });
      const errors = await validate(dto);
      const props = errors.map((e) => e.property);
      expect(props).toContain('cedula');
    });
  });

  describe('pin validation', () => {
    it('fails when pin contains letters', async () => {
      const dto = plainToInstance(MesLoginDto, { cedula: '12345678', pin: '12AB' });
      const errors = await validate(dto);
      const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
      expect(messages.some((m) => m.includes('pin'))).toBe(true);
    });

    it('fails when pin is shorter than 4 digits', async () => {
      const dto = plainToInstance(MesLoginDto, { cedula: '12345678', pin: '123' });
      const errors = await validate(dto);
      const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
      expect(messages.some((m) => m.includes('pin'))).toBe(true);
    });

    it('fails when pin is longer than 6 digits', async () => {
      const dto = plainToInstance(MesLoginDto, { cedula: '12345678', pin: '1234567' });
      const errors = await validate(dto);
      const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
      expect(messages.some((m) => m.includes('pin'))).toBe(true);
    });

    it('fails when pin is an empty string', async () => {
      const dto = plainToInstance(MesLoginDto, { cedula: '12345678', pin: '' });
      const errors = await validate(dto);
      const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
      expect(messages.some((m) => m.includes('pin'))).toBe(true);
    });

    it('fails when pin is missing', async () => {
      const dto = plainToInstance(MesLoginDto, { cedula: '12345678' });
      const errors = await validate(dto);
      const props = errors.map((e) => e.property);
      expect(props).toContain('pin');
    });
  });

  describe('both fields missing', () => {
    it('fails with errors for both cedula and pin when both are absent', async () => {
      const dto = plainToInstance(MesLoginDto, {});
      const errors = await validate(dto);
      const props = errors.map((e) => e.property);
      expect(props).toContain('cedula');
      expect(props).toContain('pin');
    });
  });
});
