import { EmpresaInformacionPreview, toast } from '@restopsiq/ui';
import { type JSX } from 'react';

import { useUiTheme } from '@/hooks/useUiTheme';
import { getErrorMessage, isGraphqlConfigured } from '@/lib/graphql-client';

import styles from '../empresa.module.scss';
import { useRestaurantProfile } from '../hooks/useRestaurantProfile';

export default function EmpresaInformacionView(): JSX.Element {
  const theme = useUiTheme();
  const {
    tenantLabel,
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
    />
  );
}
