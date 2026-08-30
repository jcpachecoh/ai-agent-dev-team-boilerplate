import { Button, Modal, RecetaFilterSelect, toast } from '@restopsiq/ui';
import { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Paperclip, X } from 'lucide-react';

import { getErrorMessage } from '@/lib/graphql-client';

import { uploadEmployeeDocument, validateEmployeeAssetFile } from '../api/employee-assets.upload';
import { useEmployeeDocumentsMutations } from '../hooks/useEmployeeDocumentsMutations';
import { DOCUMENT_FILE_TYPE_OPTIONS } from '../types/employee-document.types';
import {
  employeeDocumentSchema,
  type EmployeeDocumentFormSchema,
} from '../validation/employeeDocument.schema';
import styles from './EmployeeAssetFormModal.module.scss';

const FILE_TYPE_OPTIONS = DOCUMENT_FILE_TYPE_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

interface EmployeeDocumentUploadModalProps {
  open: boolean;
  theme: 'light' | 'dark';
  employeeId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function EmployeeDocumentUploadModal({
  open,
  theme,
  employeeId,
  onClose,
  onSuccess,
}: EmployeeDocumentUploadModalProps): React.JSX.Element | null {
  const mutations = useEmployeeDocumentsMutations(employeeId);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const busy = mutations.createMutation.isPending || uploading;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EmployeeDocumentFormSchema>({
    resolver: zodResolver(employeeDocumentSchema),
    defaultValues: { fileType: undefined, title: '', issueDate: '', expiryDate: '', notes: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ fileType: undefined, title: '', issueDate: '', expiryDate: '', notes: '' });
      setSelectedFile(null);
      setFileError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const error = validateEmployeeAssetFile(file);
    if (error) {
      setFileError(error);
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (values: EmployeeDocumentFormSchema) => {
    if (!selectedFile) {
      setFileError('Debes adjuntar un archivo');
      return;
    }
    try {
      setUploading(true);
      const uploaded = await uploadEmployeeDocument(employeeId, selectedFile);
      setUploading(false);

      await mutations.createMutation.mutateAsync({
        employeeId,
        fileType: values.fileType,
        title: values.title,
        storageObjectId: uploaded.id,
        issueDate: values.issueDate || undefined,
        expiryDate: values.expiryDate || undefined,
        notes: values.notes || undefined,
      });

      toast.success('Documento registrado correctamente');
      onSuccess();
      onClose();
    } catch (error) {
      setUploading(false);
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !busy) onClose();
      }}
      size="md"
      theme={theme}
      title="Agregar documento"
      description="Sube un documento del colaborador clasificado por tipo."
      onInteractOutside={(event) => {
        if (busy) event.preventDefault();
      }}
      footer={
        <>
          <Button variant="secondary" size="medium" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="medium"
            onClick={() => void handleSubmit(onSubmit)()}
            disabled={busy}
          >
            {uploading ? 'Subiendo archivo…' : busy ? 'Guardando…' : 'Guardar documento'}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <label className={styles.field}>
          <span className={styles.label}>Tipo de documento</span>
          <Controller
            name="fileType"
            control={control}
            render={({ field }) => (
              <RecetaFilterSelect
                aria-label="Tipo de documento"
                options={FILE_TYPE_OPTIONS}
                value={field.value ?? ''}
                onChange={field.onChange}
                theme={theme}
                size="md"
              />
            )}
          />
          {errors.fileType ? <p className={styles.error}>{errors.fileType.message}</p> : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Título</span>
          <input
            className={styles.input}
            type="text"
            placeholder="ej. Cédula de ciudadanía 1234567890"
            autoComplete="off"
            {...register('title')}
          />
          {errors.title ? <p className={styles.error}>{errors.title.message}</p> : null}
        </label>

        <div className={styles.field} style={{ flexDirection: 'row', gap: '12px' }}>
          <label className={styles.field} style={{ flex: 1 }}>
            <span className={styles.label}>Fecha de expedición (opcional)</span>
            <input
              className={styles.input}
              type="date"
              autoComplete="off"
              {...register('issueDate')}
            />
          </label>
          <label className={styles.field} style={{ flex: 1 }}>
            <span className={styles.label}>Fecha de vencimiento (opcional)</span>
            <input
              className={styles.input}
              type="date"
              autoComplete="off"
              {...register('expiryDate')}
            />
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Observaciones (opcional)</span>
          <textarea
            className={styles.textarea}
            rows={2}
            placeholder="Notas adicionales sobre el documento"
            {...register('notes')}
          />
        </label>

        <div className={styles.field}>
          <span className={styles.label}>Archivo *</span>
          <input
            ref={fileInputRef}
            className={styles.fileInput}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
          />
          {selectedFile ? (
            <div className={styles.fileSelected}>
              <Paperclip size={13} aria-hidden />
              <span className={styles.fileName}>{selectedFile.name}</span>
              <button
                type="button"
                className={styles.fileClearButton}
                onClick={clearFile}
                disabled={busy}
                aria-label="Quitar archivo"
              >
                <X size={13} aria-hidden />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.fileButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              <Paperclip size={13} aria-hidden />
              Adjuntar archivo
            </button>
          )}
          {fileError ? <p className={styles.error}>{fileError}</p> : null}
        </div>
      </div>
    </Modal>
  );
}
