import { BadRequestException } from '@nestjs/common';
import {
  getClientIpFromContext,
  getTenantIdFromContext,
  getUserAgentFromContext,
} from '../tenant-from-context';

describe('tenant-from-context', () => {
  describe('getTenantIdFromContext', () => {
    it('returns trimmed tenant id from header', () => {
      expect(
        getTenantIdFromContext({ req: { headers: { 'x-tenant-id': '  palos-de-lena  ' } } }),
      ).toBe('palos-de-lena');
    });

    it('throws when header is missing', () => {
      expect(() => getTenantIdFromContext({ req: { headers: {} } })).toThrow(BadRequestException);
    });

    it('throws when header is blank', () => {
      expect(() => getTenantIdFromContext({ req: { headers: { 'x-tenant-id': '   ' } } })).toThrow(
        BadRequestException,
      );
    });

    it('throws when header is not a string', () => {
      expect(() => getTenantIdFromContext({ req: { headers: { 'x-tenant-id': ['a'] } } })).toThrow(
        BadRequestException,
      );
    });
  });

  describe('getClientIpFromContext', () => {
    it('returns first forwarded IP when present', () => {
      expect(
        getClientIpFromContext({
          req: { headers: { 'x-forwarded-for': ' 10.0.0.1 , 10.0.0.2 ' } },
        }),
      ).toBe('10.0.0.1');
    });

    it('returns unknown when forwarded header is absent', () => {
      expect(getClientIpFromContext({ req: { headers: {} } })).toBe('unknown');
    });

    it('returns unknown when forwarded header is not a string', () => {
      expect(getClientIpFromContext({ req: { headers: { 'x-forwarded-for': 1 } } })).toBe(
        'unknown',
      );
    });
  });

  describe('getUserAgentFromContext', () => {
    it('returns user-agent when it is a string', () => {
      expect(getUserAgentFromContext({ req: { headers: { 'user-agent': 'jest-test' } } })).toBe(
        'jest-test',
      );
    });

    it('returns undefined when user-agent is missing or not a string', () => {
      expect(getUserAgentFromContext({ req: { headers: {} } })).toBeUndefined();
      expect(getUserAgentFromContext({ req: { headers: { 'user-agent': 42 } } })).toBeUndefined();
    });
  });
});
