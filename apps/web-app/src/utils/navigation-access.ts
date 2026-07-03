import {
  AppModule,
  canAccessModule,
  isPayrollReadOnlyRole,
  NAV_ID_TO_MODULE,
  NOMINA_HIDDEN_NAV_CHILD_IDS,
} from '@/config/rbac.config';
import type { NavItem } from '@/constants/navigation';

export function getVisibleNavigationItems(
  roleCode: string | null | undefined,
  items: NavItem[],
): NavItem[] {
  return items
    .map((item) => {
      const module = NAV_ID_TO_MODULE[item.id];
      if (module && !canAccessModule(roleCode, module)) {
        return null;
      }

      if (!item.children?.length) {
        return item;
      }

      const children = item.children.filter((child) => {
        if (isPayrollReadOnlyRole(roleCode) && NOMINA_HIDDEN_NAV_CHILD_IDS.has(child.id)) {
          return false;
        }
        return true;
      });

      if (children.length === 0) {
        return null;
      }

      return { ...item, children };
    })
    .filter((item): item is NavItem => item !== null);
}

export function getModuleForNavItem(navItemId: string): AppModule | undefined {
  return NAV_ID_TO_MODULE[navItemId];
}
