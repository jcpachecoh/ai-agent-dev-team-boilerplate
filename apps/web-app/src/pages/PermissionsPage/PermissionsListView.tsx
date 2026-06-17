import { useMemo, type JSX } from 'react';

import { usePermissionCatalog } from '@/features/roles/hooks/useAdminRoles';
import type { PermissionCatalogItem } from '@/features/roles/types';

import styles from './PermissionsListView.module.scss';

function groupByModule(items: PermissionCatalogItem[]): Map<string, PermissionCatalogItem[]> {
  const map = new Map<string, PermissionCatalogItem[]>();
  for (const item of items) {
    const key = item.module ?? 'other';
    const group = map.get(key) ?? [];
    group.push(item);
    map.set(key, group);
  }
  return map;
}

export default function PermissionsListView(): JSX.Element {
  const { data, isLoading } = usePermissionCatalog();
  const grouped = useMemo(() => groupByModule(data ?? []), [data]);

  return (
    <div className={styles.screen}>
      <header className={styles.pageHeader}>
        <h1>Catálogo de Permisos</h1>
        <p>
          Los permisos definen qué acciones puede realizar cada rol en el sistema. Solo lectura.
        </p>
      </header>

      <div className={styles.body}>
        {isLoading ? (
          <div className={styles.loading}>Cargando permisos…</div>
        ) : (
          Array.from(grouped.entries()).map(([module, perms]) => (
            <section key={module} className={styles.moduleSection}>
              <div className={styles.moduleHeader}>
                <span className={styles.moduleTitle}>{module}</span>
                <span className={styles.moduleCount}>{perms.length}</span>
              </div>
              <div className={styles.permissionList}>
                {perms.map((p) => (
                  <div key={p.id} className={styles.permissionRow}>
                    <span className={styles.permCode}>{p.code}</span>
                    <span className={styles.permName}>{p.name}</span>
                    {p.description ? (
                      <span className={styles.permDesc}>{p.description}</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
