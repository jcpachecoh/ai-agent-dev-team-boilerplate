import { describe, expect, it } from 'vitest';

import { groupPermissionsByModule } from './permiso-utils';
import type { PermisoCatalogItem } from './permiso-types';

const items: PermisoCatalogItem[] = [
  { id: '1', code: 'users.read', name: 'Ver usuarios', module: 'users' },
  { id: '2', code: 'users.write', name: 'Editar usuarios', module: 'users' },
  { id: '3', code: 'payroll.read', name: 'Ver nómina', module: null },
];

describe('groupPermissionsByModule', () => {
  it('groups permissions by module key', () => {
    const grouped = groupPermissionsByModule(items);
    expect(grouped.get('users')).toHaveLength(2);
    expect(grouped.get('other')).toHaveLength(1);
  });
});
