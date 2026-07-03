import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { DocumentType } from '@prisma/client';
import { SignupDto } from '../controller/dto/signup.dto';
import { ChangePasswordDto } from '../controller/dto/change-password.dto';
import { ResetPasswordDto } from '../controller/dto/reset-password.dto';

const signupBase = {
  email: 'user@example.com',
  cedula: '12345678',
  documentType: DocumentType.CC,
};

describe('Auth password DTO validation (AUTH-03: minimum 9 characters)', () => {
  describe('SignupDto', () => {
    it('rejects password with exactly 8 characters', async () => {
      const dto = plainToInstance(SignupDto, { ...signupBase, password: '12345678' });
      const errors = await validate(dto);
      const passwordErrors = errors.filter((e) => e.property === 'password');
      expect(passwordErrors.length).toBeGreaterThan(0);
    });

    it('accepts password with 9 characters', async () => {
      const dto = plainToInstance(SignupDto, { ...signupBase, password: '123456789' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('ChangePasswordDto', () => {
    it('rejects newPassword with exactly 8 characters', async () => {
      const dto = plainToInstance(ChangePasswordDto, {
        currentPassword: 'oldpassword',
        newPassword: '12345678',
      });
      const errors = await validate(dto);
      const fieldErrors = errors.filter((e) => e.property === 'newPassword');
      expect(fieldErrors.length).toBeGreaterThan(0);
    });

    it('accepts newPassword with 9 characters', async () => {
      const dto = plainToInstance(ChangePasswordDto, {
        currentPassword: 'oldpassword',
        newPassword: '123456789',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('ResetPasswordDto', () => {
    it('rejects newPassword with exactly 8 characters', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        token: 'reset-token',
        newPassword: '12345678',
      });
      const errors = await validate(dto);
      const fieldErrors = errors.filter((e) => e.property === 'newPassword');
      expect(fieldErrors.length).toBeGreaterThan(0);
    });

    it('accepts newPassword with 9 characters', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        token: 'reset-token',
        newPassword: '123456789',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
