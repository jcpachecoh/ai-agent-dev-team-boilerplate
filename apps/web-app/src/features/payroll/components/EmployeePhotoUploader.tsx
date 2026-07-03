import { useRef, useState } from 'react';
import { toast } from '@restopsiq/ui';
import { EmpleadoAvatar } from '@restopsiq/ui';

import { updatePayrollEmployee } from '../api/payroll.client';
import {
  EmployeePhotoApiError,
  uploadEmployeePhoto,
  validateEmployeePhotoFile,
} from '../api/employee-photo.api';
import type { PayrollEmployee } from '../types/payroll.types';
import styles from './EmployeePhotoUploader.module.scss';

interface EmployeePhotoUploaderProps {
  employee: PayrollEmployee;
  onPhotoUpdated: (photoUrl: string) => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function EmployeePhotoUploader({ employee, onPhotoUpdated }: EmployeePhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(employee.photoUrl ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!inputRef.current) return;
    inputRef.current.value = '';

    if (!file) return;

    const validationError = validateEmployeePhotoFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploading(true);
    const loadingToast = toast.loading('Subiendo foto...');

    try {
      const uploaded = await uploadEmployeePhoto(employee.id, file);

      await updatePayrollEmployee(employee.userId, {
        photoStorageObjectId: uploaded.id,
      });

      setPreviewUrl(uploaded.publicUrl);
      if (uploaded.publicUrl) {
        onPhotoUpdated(uploaded.publicUrl);
      }
      toast.dismiss(loadingToast);
      toast.success('Foto actualizada');
    } catch (err) {
      toast.dismiss(loadingToast);
      const message =
        err instanceof EmployeePhotoApiError
          ? err.message
          : 'Error al actualizar la foto del empleado';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  const initials = getInitials(employee.name);

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.avatarButton}
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title="Cambiar foto"
        aria-label="Cambiar foto del empleado"
      >
        <EmpleadoAvatar initials={initials} photoUrl={previewUrl} size="lg" />
        <span className={styles.overlay} aria-hidden>
          {uploading ? <span className={styles.spinner} /> : 'Cambiar'}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        aria-hidden
      />

      <span className={styles.hint}>JPG, PNG o WebP · máx. 2 MB</span>
    </div>
  );
}
