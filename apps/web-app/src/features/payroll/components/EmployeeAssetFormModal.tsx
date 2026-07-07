import { Button, Modal, RecetaFilterSelect, toast } from '@restopsiq/ui';
import { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Paperclip, X } from 'lucide-react';

import { ThousandsInput } from '@/components/shared/ThousandsInput';
import { getErrorMessage } from '@/lib/graphql-client';

import { uploadEmployeeDocument, validateEmployeeAssetFile } from '../api/employee-assets.upload';
import { useEmployeeAssetsMutations } from '../hooks/useEmployeeAssetsMutations';
import { ASSET_TYPE_OPTIONS } from '../types/employee-asset.types';
import {
  employeeAssetSchema,
  type EmployeeAssetFormValues,
} from '../validation/employeeAsset.schema';
import styles from './EmployeeAssetFormModal.module.scss';

const TYPE_OPTIONS = ASSET_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

function todayIso(): string {
  return new Date().toISOString().split('T')[0]!;
}

interface EmployeeAssetFormModalProps {
  open: boolean;
  theme: 'light' | 'dark';
  employeeId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function EmployeeAssetFormModal({
  open,
  theme,
  employeeId,
  onClose,
  onSuccess,
}: EmployeeAssetFormModalProps): React.JSX.Element | null {
  const mutations = useEmployeeAssetsMutations(employeeId);

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
  } = useForm<EmployeeAssetFormValues>({
    resolver: zodResolver(employeeAssetSchema),
    defaultValues: {
      assetName: '',
      type: undefined,
      value: '',
      assignmentDate: todayIso(),
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        assetName: '',
        type: undefined,
        value: '',
        assignmentDate: todayIso(),
        notes: '',
      });
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

  const onSubmit = async (values: EmployeeAssetFormValues) => {
    try {
      let storageObjectId: string | undefined;
      if (selectedFile) {
        setUploading(true);
        const uploaded = await uploadEmployeeDocument(employeeId, selectedFile);
        storageObjectId = uploaded.id;
        setUploading(false);
      }
      await mutations.createMutation.mutateAsync({
        employeeId,
        assetName: values.assetName,
        type: values.type,
        value: Number(values.value),
        assignmentDate: values.assignmentDate || undefined,
        notes: values.notes || undefined,
        storageObjectId,
      });
      toast.success('Activo registrado correctamente');
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
      title="Agregar activo"
      description="Registra un equipo, documento o recurso asignado al colaborador."
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
            {uploading ? 'Subiendo archivo…' : busy ? 'Guardando…' : 'Registrar activo'}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <label className={styles.field}>
          <span className={styles.label}>Nombre del activo</span>
          <input
            className={styles.input}
            type="text"
            placeholder="ej. Computador portátil Dell XPS"
            autoComplete="off"
            {...register('assetName')}
          />
          {errors.assetName ? <p className={styles.error}>{errors.assetName.message}</p> : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Categoría</span>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <RecetaFilterSelect
                aria-label="Categoría del activo"
                options={TYPE_OPTIONS}
                value={field.value ?? ''}
                onChange={field.onChange}
                theme={theme}
                size="md"
              />
            )}
          />
          {errors.type ? <p className={styles.error}>{errors.type.message}</p> : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Valor (COP)</span>
          <Controller
            name="value"
            control={control}
            render={({ field }) => (
              <ThousandsInput
                className={styles.input}
                placeholder="0"
                autoComplete="off"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.value ? <p className={styles.error}>{errors.value.message}</p> : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Fecha de asignación</span>
          <input
            className={styles.input}
            type="date"
            autoComplete="off"
            {...register('assignmentDate')}
          />
          {errors.assignmentDate ? (
            <p className={styles.error}>{errors.assignmentDate.message}</p>
          ) : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Observaciones (opcional)</span>
          <textarea
            className={styles.textarea}
            rows={3}
            placeholder="Notas adicionales sobre el activo"
            {...register('notes')}
          />
          {errors.notes ? <p className={styles.error}>{errors.notes.message}</p> : null}
        </label>

        <div className={styles.field}>
          <span className={styles.label}>Documento adjunto (opcional)</span>
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
              Adjuntar documento
            </button>
          )}
          {fileError ? <p className={styles.error}>{fileError}</p> : null}
        </div>
      </div>
    </Modal>
  );
}
