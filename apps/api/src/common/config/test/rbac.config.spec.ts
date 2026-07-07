import { AppModule, canAccessModule } from '../rbac.config';

describe('canAccessModule', () => {
  it('returns false when roleCode is undefined', () => {
    expect(canAccessModule(undefined, AppModule.NOMINA)).toBe(false);
  });

  it('returns true when role is allowed for the module', () => {
    expect(canAccessModule('OWNER', AppModule.NOMINA)).toBe(true);
  });

  it('returns false when role is not allowed for the module', () => {
    expect(canAccessModule('OPERATOR', AppModule.NOMINA)).toBe(false);
  });
});
