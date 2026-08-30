import React, { type CSSProperties, type JSX } from 'react';

import { ProveedorDocumentationIconButton } from '../proveedor-documentation-icon-button/ProveedorDocumentationIconButton';
import { ProveedorStatusBadge } from '../proveedor-status-badge/ProveedorStatusBadge';
import { documentationGridTemplate } from '../shared/proveedor-detail-columns';
import type {
  ProveedorDocumentRequirement,
  ProveedorDocumentStatus,
  ProveedorSize,
  ProveedorTheme,
} from '../shared/proveedor-types';
import styles from './ProveedorDocumentationTableRow.module.scss';

export interface ProveedorDocumentationTableRowProps {
  documentLabel: string;
  requirement?: ProveedorDocumentRequirement;
  validityLabel?: string;
  status?: ProveedorDocumentStatus;
  uploadedAtLabel?: string;
  canWrite?: boolean;
  hasCurrentVersion?: boolean;
  hasPreviousVersion?: boolean;
  onUpload?: () => void;
  onReplace?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onDownloadPrevious?: () => void;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

const requirementLabels: Record<ProveedorDocumentRequirement, string> = {
  required: 'Sí',
  conditional: 'Cond.',
  recommended: 'Rec.',
};

export function ProveedorDocumentationTableRow({
  documentLabel,
  requirement = 'conditional',
  validityLabel = '—',
  status = 'pending',
  uploadedAtLabel = '—',
  canWrite = false,
  hasCurrentVersion = false,
  hasPreviousVersion = false,
  onUpload,
  onReplace,
  onDelete,
  onDownload,
  onDownloadPrevious,
  theme = 'light',
  size = 'xl',
  className,
}: ProveedorDocumentationTableRowProps): JSX.Element {
  return (
    <div
      className={[styles.row, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
      style={{ '--proveedor-columns': documentationGridTemplate } as CSSProperties}
    >
      <span className={styles.document} role="cell">
        {documentLabel}
      </span>
      <span className={styles.center} role="cell">
        {requirementLabels[requirement]}
      </span>
      <span className={styles.muted} role="cell">
        {validityLabel}
      </span>
      <span className={styles.status} role="cell">
        <ProveedorStatusBadge domain="documentation" status={status} theme={theme} size="sm" />
      </span>
      <span className={styles.muted} role="cell">
        {uploadedAtLabel}
      </span>
      <span className={styles.actions} role="cell">
        {hasCurrentVersion && onDownload ? (
          <ProveedorDocumentationIconButton variant="download" theme={theme} onClick={onDownload} />
        ) : null}
        {hasPreviousVersion && onDownloadPrevious ? (
          <ProveedorDocumentationIconButton
            variant="download"
            tooltip="Descargar versión anterior"
            theme={theme}
            onClick={onDownloadPrevious}
          />
        ) : null}
        {canWrite ? (
          hasCurrentVersion ? (
            <>
              <ProveedorDocumentationIconButton
                variant="replace"
                theme={theme}
                onClick={onReplace}
              />
              <ProveedorDocumentationIconButton variant="delete" theme={theme} onClick={onDelete} />
            </>
          ) : (
            <ProveedorDocumentationIconButton variant="upload" theme={theme} onClick={onUpload} />
          )
        ) : null}
      </span>
    </div>
  );
}

export default ProveedorDocumentationTableRow;
