import { EmpresaInformacionPreview, toast } from '@restopsiq/ui';
import { type JSX } from 'react';

import { useUiTheme } from '@/hooks/useUiTheme';
import { getErrorMessage, isGraphqlConfigured } from '@/lib/graphql-client';

import styles from '../empresa.module.scss';
import { useRestaurantProfile } from '../hooks/useRestaurantProfile';
import { useUploadTenantLogo } from '../hooks/useUploadTenantLogo';

export default function EmpresaInformacionView(): JSX.Element {
  const theme = useUiTheme();
  const uploadLogo = useUploadTenantLogo();
  const {
    tenantLabel,
    logoUrl,
    values,
    metadata,
    accessBadgeLabel,
    editing,
    isLoading,
    isError,
    isSaving,
    error,
    startEditing,
    cancelEditing,
    updateField,
    saveProfile,
  } = useRestaurantProfile();

  const handleSave = async () => {
    try {
      await saveProfile();
      toast.success('Información del restaurante actualizada.');
    } catch (saveError) {
      toast.error(getErrorMessage(saveError));
    }
  };

  const handleLogoFileSelect = (file: File) => {
    uploadLogo.mutate(file, {
      onSuccess: () => toast.success('Logo del restaurante actualizado.'),
      onError: (uploadError) => toast.error(getErrorMessage(uploadError)),
    });
  };

  if (!isGraphqlConfigured()) {
    return (
      <p className={styles.banner}>
        Inicia sesión para cargar la información del restaurante. En dev:{' '}
        <code>pnpm --filter @restopsiq/api start:dev</code>
      </p>
    );
  }

  if (isLoading || !values) {
    return <p className={styles.stateMessage}>Cargando información del restaurante…</p>;
  }

  if (isError) {
    return (
      <p className={`${styles.stateMessage} ${styles.stateMessageError}`}>
        {getErrorMessage(error)}
      </p>
    );
  }

  return (
    <EmpresaInformacionPreview
      theme={theme}
      tenantLabel={tenantLabel}
      logoUrl={logoUrl}
      values={values}
      metadata={metadata}
      accessBadgeLabel={accessBadgeLabel}
      showSyncBadge
      editing={editing}
      onEditClick={startEditing}
      onCancel={cancelEditing}
      onSave={handleSave}
      saveLoading={isSaving}
      onFieldChange={updateField}
      logoUploading={uploadLogo.isPending}
      onLogoFileSelect={handleLogoFileSelect}
      onLogoFileError={(message) => toast.error(message)}
    />
  );
}
