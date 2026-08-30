import { describe, expect, it } from 'vitest';

import { navigationItems } from '@/constants/navigation';

import { getVisibleNavigationItems } from './navigation-access';

describe('getVisibleNavigationItems', () => {
  it('shows Dashboard for OPERATOR (only module they can access)', () => {
    const visible = getVisibleNavigationItems('OPERATOR', navigationItems);
    expect(visible.map((item) => item.id)).toEqual(['dashboard']);
  });

  it('shows all modules for OWNER', () => {
    const visible = getVisibleNavigationItems('OWNER', navigationItems);
    expect(visible.length).toBeGreaterThan(1);
    expect(visible.some((item) => item.id === 'dashboard')).toBe(true);
    expect(visible.some((item) => item.id === 'proveedores')).toBe(true);
  });

  it('returns empty list when role is unknown', () => {
    const visible = getVisibleNavigationItems(undefined, navigationItems);
    expect(visible).toEqual([]);
  });
});
