import { X } from 'lucide-react';
import type { JSX, ReactNode } from 'react';

import { RolCodeChip } from '../rol-code-chip';
import type { RolTheme } from '../shared/rol-types';
import styles from './RolPermissionsPanel.module.scss';

export interface RolPermissionsPanelProps {
  roleName: string;
  roleCode: string;
  dirtyCount?: number;
  loading?: boolean;
  canEdit?: boolean;
  saving?: boolean;
  children?: ReactNode;
  onClose: () => void;
  onSave?: () => void;
  onDiscard?: () => void;
  theme?: RolTheme;
  className?: string;
}

export function RolPermissionsPanel({
  roleName,
  roleCode,
  dirtyCount = 0,
  loading = false,
  canEdit = false,
  saving = false,
  children,
  onClose,
  onSave,
  onDiscard,
  theme = 'dark',
  className,
}: RolPermissionsPanelProps): JSX.Element {
  const isDirty = dirtyCount > 0;

  return (
    <aside
      className={[styles.panel, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
      aria-label={`Permisos de ${roleName}`}
    >
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h3 className={styles.roleName}>{roleName}</h3>
          <RolCodeChip code={roleCode} theme={theme} size="sm" />
          {isDirty ? (
            <span className={styles.dirtyBadge}>
              {dirtyCount} cambio{dirtyCount !== 1 ? 's' : ''}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Cerrar panel"
        >
          <X size={14} aria-hidden />
        </button>
      </div>

      <div className={styles.body}>
        {loading ? <div className={styles.loading}>Cargando permisos…</div> : children}
      </div>

      <div className={styles.footer}>
        {canEdit ? (
          <>
            <button
              type="button"
              className={styles.discardBtn}
              onClick={onDiscard}
              disabled={!isDirty || saving}
            >
              Descartar
            </button>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={onSave}
              disabled={!isDirty || saving}
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </>
        ) : (
          <span className={styles.readonlyNote}>
            Solo lectura — sin permiso para asignar permisos
          </span>
        )}
      </div>
    </aside>
  );
}

export default RolPermissionsPanel;
