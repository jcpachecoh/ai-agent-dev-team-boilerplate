import { FileUpload } from '@restopsiq/ui';
import { useEffect, useState } from 'react';

import { useTheme } from '@/providers/ThemeProvider';

import { validatePayrollNovedadSupportFile } from '../api/payroll-novedades.client';
import styles from './PayrollNovedadSupportFileUpload.module.scss';

const SUPPORT_ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
const SUPPORT_MAX_BYTES = 10 * 1024 * 1024;

export interface PayrollNovedadSupportFileUploadProps {
  onChange: (file: File | null) => void;
  disabled?: boolean;
  error?: string | null;
  onErrorChange?: (message: string | null) => void;
  resetKey?: string | number;
}

export function PayrollNovedadSupportFileUpload({
  onChange,
  disabled = false,
  error = null,
  onErrorChange,
  resetKey = 0,
}: PayrollNovedadSupportFileUploadProps): React.JSX.Element {
  const { theme } = useTheme();
  const uiTheme = theme === 'light' ? 'light' : 'dark';
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    setSessionKey((current) => current + 1);
  }, [resetKey]);

  const handleFilesSelected = (files: File[]) => {
    if (disabled) return;

    const file = files[0] ?? null;
    if (!file) {
      onChange(null);
      onErrorChange?.(null);
      return;
    }

    const validationError = validatePayrollNovedadSupportFile(file);
    if (validationError) {
      onErrorChange?.(validationError);
      onChange(null);
      setSessionKey((current) => current + 1);
      return;
    }

    onErrorChange?.(null);
    onChange(file);
  };

  return (
    <div className={[styles.wrapper, disabled ? styles.disabled : ''].filter(Boolean).join(' ')}>
      <FileUpload
        key={`${resetKey}-${sessionKey}`}
        theme={uiTheme}
        size="md"
        className={styles.uploadZone}
        accept={SUPPORT_ACCEPT}
        maxSize={SUPPORT_MAX_BYTES}
        label="Haz clic o arrastra el soporte"
        description="PDF, JPG o PNG · máximo 10 MB"
        onFileSelect={handleFilesSelected}
      />
      <span className={styles.hint}>Obligatorio para este tipo de novedad.</span>
      {error ? <span className={styles.error}>{error}</span> : null}
    </div>
  );
}
