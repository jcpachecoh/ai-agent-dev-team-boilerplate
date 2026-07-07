import type { PermisoCatalogItem } from './permiso-types';

export function groupPermissionsByModule(
  items: PermisoCatalogItem[],
): Map<string, PermisoCatalogItem[]> {
  const map = new Map<string, PermisoCatalogItem[]>();

  for (const item of items) {
    const key = item.module ?? 'other';
    const group = map.get(key) ?? [];
    group.push(item);
    map.set(key, group);
  }

  return map;
}
