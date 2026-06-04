import { BadRequestException } from '@nestjs/common';

import {
  getClientIpFromContext,
  getTenantIdFromContext,
  getUserAgentFromContext,
  type GqlRequestContext,
} from '../tenant-from-context';

describe('tenant-from-context', () => {
  describe('getTenantIdFromContext', () => {
    it('returns trimmed tenant id from x-tenant-id header', () => {
      const context: GqlRequestContext = {
        req: { headers: { 'x-tenant-id': '  palos-de-lena  ' } },
      };

      expect(getTenantIdFromContext(context)).toBe('palos-de-lena');
    });

    it('throws when x-tenant-id is missing', () => {
      expect(() => getTenantIdFromContext({ req: { headers: {} } })).toThrow(BadRequestException);
    });

    it('throws when x-tenant-id is blank', () => {
      expect(() => getTenantIdFromContext({ req: { headers: { 'x-tenant-id': '   ' } } })).toThrow(
        BadRequestException,
      );
    });

    it('throws when x-tenant-id is not a string', () => {
      expect(() => getTenantIdFromContext({ req: { headers: { 'x-tenant-id': 123 } } })).toThrow(
        BadRequestException,
      );
    });
  });

  describe('getClientIpFromContext', () => {
    it('uses first hop from x-forwarded-for', () => {
      const context: GqlRequestContext = {
        req: { headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.2' } },
      };

      expect(getClientIpFromContext(context)).toBe('203.0.113.1');
    });

    it('returns unknown when forwarded header is absent', () => {
      expect(getClientIpFromContext({ req: { headers: {} } })).toBe('unknown');
    });

    it('returns unknown when forwarded header is empty', () => {
      expect(getClientIpFromContext({ req: { headers: { 'x-forwarded-for': '' } } })).toBe(
        'unknown',
      );
    });
  });

  describe('getUserAgentFromContext', () => {
    it('returns user-agent when present', () => {
      expect(getUserAgentFromContext({ req: { headers: { 'user-agent': 'Mozilla/5.0' } } })).toBe(
        'Mozilla/5.0',
      );
    });

    it('returns undefined when user-agent is not a string', () => {
      expect(
        getUserAgentFromContext({ req: { headers: { 'user-agent': ['curl'] } } }),
      ).toBeUndefined();
    });
  });
});
