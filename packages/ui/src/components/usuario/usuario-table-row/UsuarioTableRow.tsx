import type { CSSProperties, JSX } from 'react';

import { UsuarioDocumentTypeBadge } from '../usuario-document-type-badge';
import { UsuarioRoleBadge } from '../usuario-role-badge';
import { UsuarioRowActionButton } from '../usuario-row-action-button';
import { UsuarioStatusBadge } from '../usuario-status-badge';
import { getUsuarioGridTemplate } from '../shared/usuario-columns';
import type { UsuarioSize, UsuarioTheme } from '../shared/usuario-types';
import { formatUsuarioLastLogin, resolveUsuarioRoleVariant } from '../shared/usuario-utils';
import styles from './UsuarioTableRow.module.scss';

export interface UsuarioTableRowProps {
  id: string;
  email: string;
  cedula: string;
  documentType: string;
  roleName: string;
  roleCode?: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  onEdit?: () => void;
  onDeactivate?: () => void;
  showActions?: boolean;
  theme?: UsuarioTheme;
  size?: UsuarioSize;
  className?: string;
}

export function UsuarioTableRow({
  id,
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
}: UsuarioTableRowProps): JSX.Element {
  const roleVariant = resolveUsuarioRoleVariant(roleCode);

  return (
    <div
      className={[styles.row, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
      data-usuario-id={id}
      style={{ '--usuario-columns': getUsuarioGridTemplate(showActions) } as CSSProperties}
    >
      <span className={styles.emailCell} role="cell" title={email}>
        {email}
      </span>
      <span className={styles.cedulaCell} role="cell">
        {cedula}
      </span>
      <div className={styles.documentCell} role="cell">
        <UsuarioDocumentTypeBadge documentType={documentType} theme={theme} size="sm" />
      </div>
      <div className={styles.roleCell} role="cell">
        <UsuarioRoleBadge label={roleName} variant={roleVariant} theme={theme} size="sm" />
      </div>
      <div className={styles.statusCell} role="cell">
        <UsuarioStatusBadge active={isActive} theme={theme} size="sm" />
      </div>
      <span className={styles.lastLoginCell} role="cell">
        {formatUsuarioLastLogin(lastLoginAt)}
      </span>
      {showActions ? (
        <div className={styles.actionsCell} role="cell">
          <UsuarioRowActionButton variant="edit" theme={theme} onClick={onEdit} />
          <UsuarioRowActionButton
            variant="deactivate"
            theme={theme}
            onClick={onDeactivate}
            disabled={!isActive}
          />
        </div>
      ) : null}
    </div>
  );
}

export default UsuarioTableRow;
