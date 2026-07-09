import { FileUpload } from '@restopsiq/ui';
import { useEffect, useState } from 'react';

import { useTheme } from '@/providers/ThemeProvider';

import { validateMedicalLeaveSupportFile } from '../api/medical-leaves.client';
import styles from './MedicalLeaveSupportFileUpload.module.scss';

const SUPPORT_ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
const SUPPORT_MAX_BYTES = 10 * 1024 * 1024;

export interface MedicalLeaveSupportFileUploadProps {
  onChange: (file: File | null) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  error?: string | null;
  onErrorChange?: (message: string | null) => void;
  resetKey?: string | number;
}

export function MedicalLeaveSupportFileUpload({
  onChange,
  disabled = false,
  label = 'Haz clic o arrastra un archivo',
  description = 'PDF, JPG o PNG · máximo 10 MB',
  error = null,
  onErrorChange,
  resetKey = 0,
}: MedicalLeaveSupportFileUploadProps): React.JSX.Element {
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

    const validationError = validateMedicalLeaveSupportFile(file);
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
        label={label}
        description={description}
        onFileSelect={handleFilesSelected}
      />
      {error ? <span className={styles.error}>{error}</span> : null}
    </div>
  );
}
