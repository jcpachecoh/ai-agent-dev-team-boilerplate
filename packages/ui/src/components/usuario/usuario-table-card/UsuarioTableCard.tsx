import type { JSX } from 'react';

import { UsuarioDocumentTypeBadge } from '../usuario-document-type-badge';
import { UsuarioRoleBadge } from '../usuario-role-badge';
import { UsuarioRowActionButton } from '../usuario-row-action-button';
import { UsuarioStatusBadge } from '../usuario-status-badge';
import type { UsuarioTableRowProps } from '../usuario-table-row';
import { formatUsuarioLastLogin, resolveUsuarioRoleVariant } from '../shared/usuario-utils';
import styles from './UsuarioTableCard.module.scss';

export type UsuarioTableCardProps = UsuarioTableRowProps;

export function UsuarioTableCard({
  id,
  name,
  email,
  cedula,
  documentType,
  roleName,
  roleCode,
  isActive,
  lastLoginAt,
  onEdit,
  onDeactivate,
  showActions = true,
  theme = 'dark',
  size = 'md',
  className,
}: UsuarioTableCardProps): JSX.Element {
  const roleVariant = resolveUsuarioRoleVariant(roleCode);

  return (
    <article
      className={[styles.card, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      data-usuario-id={id}
    >
      <header className={styles.header}>
        <div className={styles.leading}>
          <p className={styles.name}>{name || '—'}</p>
          <p className={styles.email}>{email}</p>
          <p className={styles.cedula}>{cedula}</p>
        </div>
        <UsuarioStatusBadge active={isActive} theme={theme} size="sm" />
      </header>

      <dl className={styles.details}>
        <div className={styles.detailRow}>
          <dt>Tipo</dt>
          <dd>
            <UsuarioDocumentTypeBadge documentType={documentType} theme={theme} size="sm" />
          </dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Rol</dt>
          <dd>
            <UsuarioRoleBadge label={roleName} variant={roleVariant} theme={theme} size="sm" />
          </dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Último acceso</dt>
          <dd>{formatUsuarioLastLogin(lastLoginAt)}</dd>
        </div>
      </dl>

      {showActions ? (
        <footer className={styles.footer}>
          <UsuarioRowActionButton variant="edit" theme={theme} onClick={onEdit} />
          <UsuarioRowActionButton
            variant="deactivate"
            theme={theme}
            onClick={onDeactivate}
            disabled={!isActive}
          />
        </footer>
      ) : null}
    </article>
  );
}

export default UsuarioTableCard;
