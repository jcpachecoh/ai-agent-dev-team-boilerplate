import {
  SedeFormActions,
  SedeFormCard,
  SedeFormField,
  SedeFormHeader,
  SedeFormLayout,
  SedeAssignedUsersPanel,
  SedePermissionBanner,
  SedeStatusSegment,
  SedePage,
  type SedeFormPreviewMode,
  type SedeFormPreviewValues,
  toast,
} from '@restopsiq/ui';
import { useEffect, useMemo, useState, type JSX } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useUiTheme } from '@/hooks/useUiTheme';
import { getErrorMessage, isGraphqlConfigured } from '@/lib/graphql-client';

import { useLocation, useLocationUsers } from '../hooks/useLocations';
import {
  useAssignUserToLocation,
  useCreateLocation,
  useRemoveUserFromLocation,
  useUpdateLocation,
} from '../hooks/useLocationMutations';
import { enrichAssignedUsers } from '../mappers/api';
import { useAssignableUsers } from '../hooks/useAssignableUsers';
import { useAdminUsers } from '@/features/usuarios/hooks/useAdminUsers';
import styles from '../sedes.module.scss';

interface SedeFormViewProps {
  mode: SedeFormPreviewMode;
}

const EMPTY_VALUES: SedeFormPreviewValues = {
  name: '',
  address: '',
  city: '',
  phone: '',
  isActive: true,
};

export default function SedeFormView({ mode }: SedeFormViewProps): JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const theme = useUiTheme();

  const locationQuery = useLocation(mode === 'edit' ? id : undefined);
  const usersQuery = useLocationUsers(mode === 'edit' ? id : undefined);
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const removeUser = useRemoveUserFromLocation(id);
  const assignUser = useAssignUserToLocation(id);

  const [values, setValues] = useState<SedeFormPreviewValues>(EMPTY_VALUES);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    if (locationQuery.data) {
      setValues(locationQuery.data);
    }
  }, [locationQuery.data]);

  const handleFieldChange = (field: keyof SedeFormPreviewValues, value: string | boolean) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!values.name?.trim() || !values.address?.trim()) {
      toast.error('Nombre y dirección son obligatorios.');
      return;
    }

    try {
      if (mode === 'create') {
        await createLocation.mutateAsync(values);
        toast.success('Sede creada correctamente.');
      } else if (id) {
        await updateLocation.mutateAsync({ id, values });
        toast.success('Cambios guardados.');
      }
      navigate('/empresa/sedes');
    } catch (submitError) {
      toast.error(getErrorMessage(submitError));
    }
  };

  const assignedUsersRaw = usersQuery.data ?? [];
  const assignedUserIds = useMemo(
    () => assignedUsersRaw.map((user) => user.id),
    [assignedUsersRaw],
  );
  const { assignableUsers } = useAssignableUsers(assignedUserIds);
  const { data: adminUsers } = useAdminUsers(false);

  const assignedUsers = useMemo(
    () => enrichAssignedUsers(assignedUsersRaw, adminUsers),
    [assignedUsersRaw, adminUsers],
  );

  const filteredAssignedUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return assignedUsers;
    return assignedUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.roleLabel.toLowerCase().includes(query),
    );
  }, [assignedUsers, userSearch]);

  const title =
    mode === 'edit'
      ? `Editar: ${locationQuery.data?.name ?? (values.name || 'Sede')}`
      : 'Nueva sede';
  const isActive = values.isActive ?? true;
  const submitting = createLocation.isPending || updateLocation.isPending;
  const loadingEdit = mode === 'edit' && locationQuery.isPending;
  const loadError = mode === 'edit' && locationQuery.isError;

  const handleRemoveUser = (userId: string) => {
    removeUser.mutate(userId, {
      onSuccess: () => toast.success('Usuario desasignado de la sede.'),
      onError: (mutationError) => toast.error(getErrorMessage(mutationError)),
    });
  };

  const handleAssignUser = () => {
    if (!selectedUserId) return;

    assignUser.mutate(selectedUserId, {
      onSuccess: () => {
        setSelectedUserId('');
        toast.success('Usuario asignado a la sede.');
      },
      onError: (mutationError) => toast.error(getErrorMessage(mutationError)),
    });
  };

  return (
    <SedePage theme={theme}>
      {!isGraphqlConfigured() && (
        <p className={styles.banner}>Inicia sesión para guardar sedes contra la API GraphQL.</p>
      )}

      <SedeFormHeader
        title={title}
        locationId={mode === 'edit' ? id : undefined}
        onBack={() => navigate('/empresa/sedes')}
        theme={theme}
      />

      {loadError && (
        <p className={`${styles.stateMessage} ${styles.stateMessageError}`} role="alert">
          {getErrorMessage(locationQuery.error)}
        </p>
      )}

      <SedeFormLayout
        theme={theme}
        sideColumn={
          mode === 'edit' ? (
            <>
              <SedeAssignedUsersPanel
                users={filteredAssignedUsers}
                searchValue={userSearch}
                onSearchChange={setUserSearch}
                onRemoveUser={handleRemoveUser}
                assignableUsers={assignableUsers}
                selectedUserId={selectedUserId}
                onSelectedUserChange={setSelectedUserId}
                onAssignUser={handleAssignUser}
                assignLoading={assignUser.isPending}
                theme={theme}
              />
              <SedePermissionBanner theme={theme} />
            </>
          ) : undefined
        }
      >
        <SedeFormCard theme={theme}>
          <SedeFormField
            label="Nombre de la sede"
            required
            placeholder="Ej: Sede Chapinero"
            value={values.name ?? ''}
            onChange={(event) => handleFieldChange('name', event.target.value)}
            theme={theme}
            disabled={loadingEdit}
          />
          <SedeFormField
            label="Dirección"
            required
            placeholder="Cra 13 # 63-40"
            value={values.address ?? ''}
            onChange={(event) => handleFieldChange('address', event.target.value)}
            theme={theme}
            disabled={loadingEdit}
          />
          <SedeFormField
            label="Ciudad"
            placeholder="Nombre de la ciudad"
            value={values.city ?? ''}
            onChange={(event) => handleFieldChange('city', event.target.value)}
            theme={theme}
            disabled={loadingEdit}
          />
          <SedeFormField
            label="Teléfono"
            placeholder="+57 601 234 5678"
            value={values.phone ?? ''}
            onChange={(event) => handleFieldChange('phone', event.target.value)}
            theme={theme}
            disabled={loadingEdit}
          />
          <SedeStatusSegment
            value={isActive ? 'active' : 'inactive'}
            onChange={(status) => handleFieldChange('isActive', status === 'active')}
            theme={theme}
          />
          <SedeFormActions
            mode={mode}
            onCancel={() => navigate('/empresa/sedes')}
            onSubmit={() => void handleSubmit()}
            submitLoading={submitting}
            submitDisabled={loadingEdit || loadError}
            theme={theme}
          />
        </SedeFormCard>
      </SedeFormLayout>
    </SedePage>
  );
}
