import React, { type JSX } from 'react';

import { SedeAssignedUsersPanel } from '../sede-assigned-users-panel';
import { SedeFormActions } from '../sede-form-actions';
import { SedeFormCard } from '../sede-form-card';
import { SedeFormField } from '../sede-form-field';
import { SedeFormHeader } from '../sede-form-header';
import { SedeFormLayout } from '../sede-form-layout';
import { SedePage } from '../sede-page';
import { SedePermissionBanner } from '../sede-permission-banner';
import { SedeStatusSegment } from '../sede-status-segment';
import type {
  SedeAssignedUser,
  SedeLocationStatus,
  SedeSize,
  SedeTheme,
} from '../shared/sede-types';

export type SedeFormPreviewMode = 'create' | 'edit';

export interface SedeFormPreviewValues {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  isActive?: boolean;
  openingTime?: string | null;
  closingTime?: string | null;
}

export interface SedeFormPreviewProps {
  mode?: SedeFormPreviewMode;
  locationId?: string;
  locationName?: string;
  values?: SedeFormPreviewValues;
  assignedUsers?: SedeAssignedUser[];
  onBack?: () => void;
  onCancel?: () => void;
  onSubmit?: () => void;
  onFieldChange?: (field: keyof SedeFormPreviewValues, value: string | boolean) => void;
  onStatusChange?: (status: SedeLocationStatus) => void;
  onRemoveUser?: (userId: string) => void;
  onUserSearchChange?: (value: string) => void;
  userSearchValue?: string;
  submitLoading?: boolean;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

const defaultAssignedUsers: SedeAssignedUser[] = [
  {
    id: 'u1',
    name: 'Ana López',
    email: 'a.lopez@palosdelena.com',
    roleLabel: 'Operadora',
    initials: 'AL',
    tone: 'teal',
  },
  {
    id: 'u2',
    name: 'Roberto Silva',
    email: 'r.silva@palosdelena.com',
    roleLabel: 'Operador',
    initials: 'RS',
    tone: 'coral',
  },
];

export function SedeFormPreview({
  mode = 'create',
  locationId = 'sed-08',
  locationName = 'Sede Bocagrande',
  values = {},
  assignedUsers = defaultAssignedUsers,
  onBack,
  onCancel,
  onSubmit,
  onFieldChange,
  onStatusChange,
  onRemoveUser,
  onUserSearchChange,
  userSearchValue = '',
  submitLoading = false,
  theme = 'light',
  size = 'md',
  className,
}: SedeFormPreviewProps): JSX.Element {
  const title = mode === 'edit' ? `Editar: ${locationName}` : 'Nueva sede';
  const isActive = values.isActive ?? true;

  return (
    <SedePage theme={theme} size={size} className={className}>
      <SedeFormHeader
        title={title}
        locationId={mode === 'edit' ? locationId : undefined}
        onBack={onBack}
        theme={theme}
        size={size}
      />
      <SedeFormLayout
        theme={theme}
        size={size}
        sideColumn={
          mode === 'edit' ? (
            <>
              <SedeAssignedUsersPanel
                users={assignedUsers}
                searchValue={userSearchValue}
                onSearchChange={onUserSearchChange}
                onRemoveUser={onRemoveUser}
                theme={theme}
                size={size}
              />
              <SedePermissionBanner theme={theme} size={size} />
            </>
          ) : undefined
        }
      >
        <SedeFormCard theme={theme} size={size}>
          <SedeFormField
            label="Nombre de la sede"
            required
            placeholder="Ej: Sede Chapinero"
            value={values.name ?? ''}
            onChange={(event) => onFieldChange?.('name', event.target.value)}
            theme={theme}
            size={size}
          />
          <SedeFormField
            label="Dirección"
            required
            placeholder="Cra 13 # 63-40"
            value={values.address ?? ''}
            onChange={(event) => onFieldChange?.('address', event.target.value)}
            theme={theme}
            size={size}
          />
          <SedeFormField
            label="Ciudad"
            placeholder="Nombre de la ciudad"
            value={values.city ?? ''}
            onChange={(event) => onFieldChange?.('city', event.target.value)}
            theme={theme}
            size={size}
          />
          <SedeFormField
            label="Teléfono"
            placeholder="+57 601 234 5678"
            value={values.phone ?? ''}
            onChange={(event) => onFieldChange?.('phone', event.target.value)}
            theme={theme}
            size={size}
          />
          <SedeStatusSegment
            value={isActive ? 'active' : 'inactive'}
            onChange={(status) => {
              onStatusChange?.(status);
              onFieldChange?.('isActive', status === 'active');
            }}
            theme={theme}
            size={size}
          />
          <SedeFormActions
            mode={mode}
            onCancel={onCancel}
            onSubmit={onSubmit}
            submitLoading={submitLoading}
            theme={theme}
            size={size}
          />
        </SedeFormCard>
      </SedeFormLayout>
    </SedePage>
  );
}

export default SedeFormPreview;
