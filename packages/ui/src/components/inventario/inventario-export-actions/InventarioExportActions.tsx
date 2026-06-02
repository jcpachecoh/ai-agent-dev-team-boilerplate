import { Download, FileText } from 'lucide-react';
import React, { type JSX } from 'react';

import { InventarioPrimaryButton } from '../inventario-primary-button';
import type { InventarioSize, InventarioTheme } from '../shared/inventario-types';
import styles from './InventarioExportActions.module.scss';

export interface InventarioExportActionsProps {
  onExportCsv?: () => void;
  onExportPdf?: () => void;
  csvLabel?: string;
  pdfLabel?: string;
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

export function InventarioExportActions({
  onExportCsv,
  onExportPdf,
  csvLabel = 'EXPORTAR CSV',
  pdfLabel = 'EXPORTAR PDF',
  theme = 'light',
  size = 'md',
  className,
}: InventarioExportActionsProps): JSX.Element {
  return (
    <div
      className={[styles.actions, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <InventarioPrimaryButton
        label={csvLabel}
        variant="success"
        icon={<Download aria-hidden />}
        onClick={onExportCsv}
        theme={theme}
        size={size}
      />
      <InventarioPrimaryButton
        label={pdfLabel}
        variant="danger"
        icon={<FileText aria-hidden />}
        onClick={onExportPdf}
        theme={theme}
        size={size}
      />
    </div>
  );
}

export default InventarioExportActions;
