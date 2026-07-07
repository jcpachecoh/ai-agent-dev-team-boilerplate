import { describe, expect, it } from 'vitest';

import { AppModule, canAccessModule } from '@/config/rbac.config';

describe('useModuleAccess matrix', () => {
  it('returns false for NOMINA on INVENTARIOS module', () => {
    expect(canAccessModule('NOMINA', AppModule.INVENTARIOS)).toBe(false);
  });

  it('returns true for NOMINA on NOMINA module', () => {
    expect(canAccessModule('NOMINA', AppModule.NOMINA)).toBe(true);
  });
});
