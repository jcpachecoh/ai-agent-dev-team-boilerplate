import type { JSX } from 'react';

import type { UsuarioSize, UsuarioTheme } from '../shared/usuario-types';
import { formatUsuarioDocumentType } from '../shared/usuario-utils';
import styles from './UsuarioDocumentTypeBadge.module.scss';

export interface UsuarioDocumentTypeBadgeProps {
  documentType?: string;
  theme?: UsuarioTheme;
  size?: UsuarioSize;
  className?: string;
}

export function UsuarioDocumentTypeBadge({
  documentType = 'CC',
  theme = 'dark',
  size = 'sm',
  className,
}: UsuarioDocumentTypeBadgeProps): JSX.Element {
  return (
    <span
      className={[styles.badge, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      {formatUsuarioDocumentType(documentType)}
    </span>
  );
}

export default UsuarioDocumentTypeBadge;
