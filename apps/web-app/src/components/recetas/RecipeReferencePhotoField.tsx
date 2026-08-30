import { FileUpload, RecetaFormButton } from '@restopsiq/ui';
import { useEffect, useState } from 'react';

import { useUiTheme } from '@/hooks/useUiTheme';

import styles from './RecipeReferencePhotoField.module.scss';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPT_ATTR = ACCEPTED_TYPES.join(',');

export interface RecipeReferencePhotoFieldProps {
  value: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export function RecipeReferencePhotoField({
  value,
  onChange,
  disabled = false,
}: RecipeReferencePhotoFieldProps) {
  const theme = useUiTheme();
  const [uploadSessionKey, setUploadSessionKey] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(value);
    setPreviewUrl(nextUrl);
    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [value]);

  const resetSelection = () => {
    onChange(null);
    setError(null);
    setUploadSessionKey((current) => current + 1);
  };

  const handleFilesSelected = (files: File[]) => {
    setError(null);
    const file = files[0];

    if (!file) {
      resetSelection();
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Solo se permiten imágenes JPG o PNG.');
      resetSelection();
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setError('La imagen no puede superar 5 MB.');
      resetSelection();
      return;
    }

    onChange(file);
  };

  return (
    <section className={styles.field} aria-label="Foto de referencia">
      <header className={styles.header}>
        <h3 className={styles.title}>Foto de referencia</h3>
        <p className={styles.hint}>Opcional · JPG o PNG · máximo 5 MB · 1 imagen</p>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      {!value ? (
        <FileUpload
          key={uploadSessionKey}
          theme={theme}
          size="md"
          className={styles.uploadZone}
          accept={ACCEPT_ATTR}
          maxSize={MAX_FILE_BYTES}
          label="Haz clic o arrastra una imagen"
          description="JPG o PNG · máximo 5 MB"
          onFileSelect={handleFilesSelected}
        />
      ) : (
        <div className={styles.previewPanel}>
          {previewUrl ? (
            <div className={styles.previewWrap}>
              <img src={previewUrl} alt={value.name} className={styles.previewImage} />
            </div>
          ) : null}
          <div className={styles.previewMeta}>
            <p className={styles.fileName}>{value.name}</p>
            <p className={styles.fileSize}>{formatFileSize(value.size)}</p>
            <RecetaFormButton
              theme={theme}
              variant="cancel"
              label="Quitar imagen"
              disabled={disabled}
              onClick={resetSelection}
            />
          </div>
        </div>
      )}
    </section>
  );
}
