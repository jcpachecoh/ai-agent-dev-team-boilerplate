import { ImageIcon } from 'lucide-react';
import React, { type ChangeEvent, type JSX, useId, useRef } from 'react';

import type { EmpresaSize, EmpresaTheme } from '../shared/empresa-types';
import styles from './EmpresaLogoPanel.module.scss';

const ACCEPTED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg']);
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export interface EmpresaLogoPanelProps {
  logoUrl?: string;
  hint?: string;
  uploadLabel?: string;
  uploading?: boolean;
  onFileSelect?: (file: File) => void;
  onFileError?: (message: string) => void;
  disabled?: boolean;
  theme?: EmpresaTheme;
  size?: EmpresaSize;
  className?: string;
}

export function EmpresaLogoPanel({
  logoUrl,
  hint = 'PNG o JPG · máx. 2 MB · recomendado 256×256 px',
  uploadLabel = 'Subir logo',
  uploading = false,
  onFileSelect,
  onFileError,
  disabled = false,
  theme = 'dark',
  size = 'md',
  className,
}: EmpresaLogoPanelProps): JSX.Element {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const isDisabled = disabled || uploading || !onFileSelect;

  const handleSelectClick = (): void => {
    if (isDisabled) {
      return;
    }

    inputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !onFileSelect) {
      return;
    }

    if (!ACCEPTED_MIME_TYPES.has(file.type)) {
      onFileError?.('Solo se permiten archivos PNG o JPG.');
      return;
    }

    if (file.size > MAX_LOGO_BYTES) {
      onFileError?.('El logo no puede superar 2 MB.');
      return;
    }

    onFileSelect(file);
  };

  return (
    <div
      className={[styles.panel, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.logoBox}>
        {logoUrl ? (
          <img className={styles.logoImage} src={logoUrl} alt="Logo del restaurante" />
        ) : (
          <ImageIcon size={28} strokeWidth={1.5} aria-hidden />
        )}
      </div>
      <p className={styles.hint}>{hint}</p>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/png,image/jpeg"
        className={styles.hiddenInput}
        onChange={handleFileChange}
        disabled={isDisabled}
        aria-hidden
        tabIndex={-1}
      />
      <button
        type="button"
        className={styles.action}
        onClick={handleSelectClick}
        disabled={isDisabled}
        aria-controls={inputId}
      >
        {uploading ? 'Subiendo…' : uploadLabel}
      </button>
    </div>
  );
}

export default EmpresaLogoPanel;
