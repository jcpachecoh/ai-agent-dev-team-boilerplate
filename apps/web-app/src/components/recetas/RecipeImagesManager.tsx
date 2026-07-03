import { EmptyState, FileUpload, RecetaFormButton, RecetaTextInput } from '@restopsiq/ui';
import { Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { RecipeImage } from '@/features/recetas/api/recipe-images.api';
import { useRecipeImageMutations } from '@/features/recetas/hooks/useRecipeImageMutations';
import { useRecipeImages } from '@/features/recetas/hooks/useRecipeImages';
import { useUiTheme } from '@/hooks/useUiTheme';

import styles from './RecipeImagesManager.module.scss';

const MAX_IMAGES = 10;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPT_ATTR = ACCEPTED_TYPES.join(',');

interface RecipeImagesManagerProps {
  recipeId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export function RecipeImagesManager({ recipeId }: RecipeImagesManagerProps) {
  const theme = useUiTheme();
  const [uploadSessionKey, setUploadSessionKey] = useState(0);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [altDraft, setAltDraft] = useState('');
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [editingAlt, setEditingAlt] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const imagesQuery = useRecipeImages(recipeId);
  const { uploadAndAdd, updateImage, deactivateImage } = useRecipeImageMutations(recipeId);

  const images = imagesQuery.data ?? [];
  const remainingSlots = Math.max(0, MAX_IMAGES - images.length);
  const isUploading = uploadAndAdd.isPending;

  const sortedImages = useMemo(
    () =>
      [...images].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.nameImage.localeCompare(b.nameImage),
      ),
    [images],
  );

  const resetPendingUpload = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPendingFile(null);
    setPreviewUrl(null);
    setAltDraft('');
    setUploadSessionKey((current) => current + 1);
  };

  const handleFilesSelected = (files: File[]) => {
    setActionError(null);
    const file = files[0];

    if (!file) {
      resetPendingUpload();
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setActionError('Solo se permiten imágenes JPG, PNG o WEBP.');
      resetPendingUpload();
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setActionError('La imagen no puede superar 5 MB.');
      resetPendingUpload();
      return;
    }

    if (remainingSlots <= 0) {
      setActionError(`La receta ya tiene el máximo de ${MAX_IMAGES} imágenes activas.`);
      resetPendingUpload();
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAltDraft(file.name.replace(/\.[^.]+$/, ''));
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile) {
      return;
    }

    setActionError(null);
    try {
      await uploadAndAdd.mutateAsync({ file: pendingFile, alt: altDraft.trim() || undefined });
      resetPendingUpload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se pudo subir la imagen.');
    }
  };

  const handleStartEditAlt = (image: RecipeImage) => {
    setEditingImageId(image.id);
    setEditingAlt(image.alt ?? '');
    setActionError(null);
  };

  const handleCancelEditAlt = () => {
    setEditingImageId(null);
    setEditingAlt('');
  };

  const handleSaveAlt = async (imageId: string) => {
    setActionError(null);
    try {
      await updateImage.mutateAsync({ id: imageId, alt: editingAlt.trim() || undefined });
      handleCancelEditAlt();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'No se pudo actualizar el texto alternativo.',
      );
    }
  };

  const handleDeactivate = async (image: RecipeImage) => {
    const confirmed = window.confirm(`¿Quitar la imagen "${image.nameImage}" de esta receta?`);
    if (!confirmed) {
      return;
    }

    setActionError(null);
    try {
      await deactivateImage.mutateAsync(image.id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se pudo quitar la imagen.');
    }
  };

  if (imagesQuery.isLoading) {
    return (
      <section className={styles.manager} aria-label="Imágenes de la receta">
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className={styles.skeletonCard} />
          ))}
        </div>
      </section>
    );
  }

  if (imagesQuery.isError) {
    return (
      <section className={styles.manager} aria-label="Imágenes de la receta">
        <div className={styles.errorBox}>
          <p>
            {imagesQuery.error instanceof Error
              ? imagesQuery.error.message
              : 'Error al cargar imágenes'}
          </p>
          <RecetaFormButton
            theme={theme}
            variant="add"
            label="Reintentar"
            onClick={() => void imagesQuery.refetch()}
          />
        </div>
      </section>
    );
  }

  return (
    <section className={styles.manager} aria-label="Imágenes de la receta">
      <header className={styles.header}>
        <div>
          <h3 className={styles.title}>Imágenes</h3>
          <p className={styles.counter}>
            {images.length} / {MAX_IMAGES} imágenes activas
            {remainingSlots > 0 ? ` · ${remainingSlots} disponibles` : ' · límite alcanzado'}
          </p>
        </div>
      </header>

      {actionError ? <p className={styles.actionError}>{actionError}</p> : null}

      {remainingSlots > 0 && !pendingFile ? (
        <div className={styles.uploadSection}>
          <FileUpload
            key={uploadSessionKey}
            theme={theme}
            size="xl"
            className={styles.uploadZone}
            accept={ACCEPT_ATTR}
            maxSize={MAX_FILE_BYTES}
            label="Haz clic o arrastra una imagen"
            description="JPG, PNG o WEBP · máximo 5 MB"
            onFileSelect={handleFilesSelected}
          />
        </div>
      ) : null}

      {pendingFile && previewUrl ? (
        <div className={styles.confirmPanel}>
          <div className={styles.confirmPreview}>
            <img src={previewUrl} alt={altDraft || pendingFile.name} />
          </div>
          <div className={styles.confirmDetails}>
            <p className={styles.confirmFileName}>{pendingFile.name}</p>
            <p className={styles.confirmFileMeta}>{formatFileSize(pendingFile.size)}</p>
            <label className={styles.altField}>
              <span>Texto alternativo</span>
              <RecetaTextInput
                theme={theme}
                type="text"
                value={altDraft}
                onChange={(event) => setAltDraft(event.target.value)}
                placeholder="Describe la imagen para accesibilidad"
                maxLength={500}
              />
            </label>
            <div className={styles.confirmActions}>
              <RecetaFormButton
                theme={theme}
                variant="cancel"
                label="Cancelar"
                disabled={isUploading}
                onClick={resetPendingUpload}
              />
              <RecetaFormButton
                theme={theme}
                variant="save"
                label={isUploading ? 'Subiendo...' : 'Subir imagen'}
                disabled={isUploading}
                onClick={() => void handleConfirmUpload()}
              />
            </div>
          </div>
        </div>
      ) : null}

      {sortedImages.length === 0 && !pendingFile ? (
        <EmptyState
          theme={theme}
          variant="search"
          title="Sin imágenes"
          description="Sube fotos de referencia para esta receta usando el área de carga."
        />
      ) : sortedImages.length > 0 ? (
        <div className={styles.grid}>
          {sortedImages.map((image) => (
            <article key={image.id} className={styles.card}>
              <div className={styles.thumbnailWrap}>
                <img
                  src={image.url}
                  alt={image.alt ?? image.nameImage}
                  className={styles.thumbnail}
                />
                {editingImageId !== image.id ? (
                  <div className={styles.thumbnailOverlay}>
                    <button
                      type="button"
                      className={styles.overlayButton}
                      aria-label={`Editar alt de ${image.nameImage}`}
                      onClick={() => handleStartEditAlt(image)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      className={[styles.overlayButton, styles.overlayButtonDanger].join(' ')}
                      aria-label={`Quitar ${image.nameImage}`}
                      onClick={() => void handleDeactivate(image)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : null}
              </div>

              <div className={styles.cardBody}>
                <p className={styles.fileName} title={image.nameImage}>
                  {image.nameImage}
                </p>

                {editingImageId === image.id ? (
                  <div className={styles.editAlt}>
                    <RecetaTextInput
                      theme={theme}
                      type="text"
                      value={editingAlt}
                      onChange={(event) => setEditingAlt(event.target.value)}
                      placeholder="Texto alternativo"
                      maxLength={500}
                      autoFocus
                    />
                    <div className={styles.editAltActions}>
                      <RecetaFormButton
                        theme={theme}
                        variant="cancel"
                        label="Cancelar"
                        onClick={handleCancelEditAlt}
                      />
                      <RecetaFormButton
                        theme={theme}
                        variant="save"
                        label="Guardar"
                        onClick={() => void handleSaveAlt(image.id)}
                      />
                    </div>
                  </div>
                ) : (
                  <p className={styles.altText}>{image.alt?.trim() || 'Sin texto alternativo'}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
