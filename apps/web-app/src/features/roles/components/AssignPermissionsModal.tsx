import { RecetaFormButton, RolModal } from '@restopsiq/ui';
import { useEffect, useMemo, useState, type JSX } from 'react';

import { useTheme } from '@/providers/ThemeProvider';

import type { PermissionCatalogItem } from '../types';
import styles from './AssignPermissionsModal.module.scss';

interface AssignPermissionsModalProps {
  open: boolean;
  assignedIds: Set<string>;
  catalog: PermissionCatalogItem[];
  saving?: boolean;
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
}

export function AssignPermissionsModal({
  open,
  assignedIds,
  catalog,
  saving = false,
  onClose,
  onConfirm,
}: AssignPermissionsModalProps): JSX.Element | null {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setSearch('');
      setSelectedIds(new Set());
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [open, onClose]);

  const available = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((p) => {
      if (!p.isActive) {
        return false;
      }
      if (assignedIds.has(p.id)) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
      );
    });
  }, [catalog, assignedIds, search]);

  const toggle = (id: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!open) {
    return null;
  }

  const count = selectedIds.size;

  return (
    <RolModal
      open={open}
      title="Agregar permisos"
      subtitle="Selecciona uno o más permisos para asignar a este rol"
      theme={theme}
      onClose={onClose}
      closeLabel="Cerrar"
      footer={
        <>
          <RecetaFormButton
            variant="cancel"
            label="Cancelar"
            theme={theme}
            onClick={onClose}
            disabled={saving}
          />
          <RecetaFormButton
            variant="save"
            label={count > 0 ? `Agregar (${count})` : 'Agregar'}
            theme={theme}
            onClick={() => {
              onConfirm([...selectedIds]);
            }}
            disabled={saving || count === 0}
          />
        </>
      }
    >
      <div className={styles.body}>
        <input
          type="search"
          className={styles.search}
          placeholder="Buscar permiso…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
          aria-label="Buscar permiso"
          autoFocus
        />

        {available.length === 0 ? (
          <p className={styles.empty}>
            {search.trim()
              ? 'Sin resultados para la búsqueda.'
              : 'Todos los permisos ya están asignados a este rol.'}
          </p>
        ) : (
          <div className={styles.list} role="list">
            {available.map((p) => {
              const checked = selectedIds.has(p.id);
              return (
                <label
                  key={p.id}
                  className={[styles.item, checked ? styles.itemSelected : '']
                    .filter(Boolean)
                    .join(' ')}
                  role="listitem"
                >
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={checked}
                    onChange={() => {
                      toggle(p.id);
                    }}
                    disabled={saving}
                  />
                  <div className={styles.itemInfo}>
                    <span className={styles.code}>{p.code}</span>
                    <span className={styles.name}>{p.name}</span>
                    {p.description ? <span className={styles.desc}>{p.description}</span> : null}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </RolModal>
  );
}
