import {
  SedeActionButton,
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
import { useMemo, useState, type JSX } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useUiTheme } from '@/hooks/useUiTheme';

import { getMockAssignedUsers, MOCK_SEDES } from '../mock/sedes.mock';

interface SedeFormViewProps {
  mode: SedeFormPreviewMode;
}

export default function SedeFormView({ mode }: SedeFormViewProps): JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const theme = useUiTheme();

  const existing = useMemo(
    () => (mode === 'edit' ? MOCK_SEDES.find((sede) => sede.id === id) : undefined),
    [id, mode],
  );

  const [values, setValues] = useState<SedeFormPreviewValues>(() => ({
    name: existing?.name ?? '',
    address: existing?.address ?? '',
    city: existing?.city ?? '',
    phone: existing?.phone ?? '',
    isActive: existing?.isActive ?? true,
  }));
  const [userSearch, setUserSearch] = useState('');
  const [assignedUsers, setAssignedUsers] = useState(() =>
    mode === 'edit' && id ? getMockAssignedUsers(id) : [],
  );
  const [submitting, setSubmitting] = useState(false);

  const handleFieldChange = (field: keyof SedeFormPreviewValues, value: string | boolean) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!values.name?.trim() || !values.address?.trim()) {
      toast.error('Nombre y dirección son obligatorios.');
      return;
    }
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      toast.success(mode === 'create' ? 'Sede creada correctamente.' : 'Cambios guardados.');
      navigate('/empresa/sedes');
    } finally {
      setSubmitting(false);
    }
  };

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

  const title = mode === 'edit' ? `Editar: ${existing?.name ?? values.name}` : 'Nueva sede';
  const isActive = values.isActive ?? true;

  return (
    <SedePage theme={theme}>
      <SedeFormHeader
        title={title}
        locationId={mode === 'edit' ? existing?.id : undefined}
        onBack={() => navigate('/empresa/sedes')}
        theme={theme}
      />
      <SedeFormLayout
        theme={theme}
        sideColumn={
          mode === 'edit' ? (
            <>
              <SedeAssignedUsersPanel
                users={filteredAssignedUsers}
                searchValue={userSearch}
                onSearchChange={setUserSearch}
                onRemoveUser={(userId) =>
                  setAssignedUsers((current) => current.filter((user) => user.id !== userId))
                }
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
          />
          <SedeFormField
            label="Dirección"
            required
            placeholder="Cra 13 # 63-40"
            value={values.address ?? ''}
            onChange={(event) => handleFieldChange('address', event.target.value)}
            theme={theme}
          />
          <SedeFormField
            label="Ciudad"
            placeholder="Nombre de la ciudad"
            value={values.city ?? ''}
            onChange={(event) => handleFieldChange('city', event.target.value)}
            theme={theme}
          />
          <SedeFormField
            label="Teléfono"
            placeholder="+57 601 234 5678"
            value={values.phone ?? ''}
            onChange={(event) => handleFieldChange('phone', event.target.value)}
            theme={theme}
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
            theme={theme}
          />
        </SedeFormCard>
      </SedeFormLayout>
    </SedePage>
  );
}
