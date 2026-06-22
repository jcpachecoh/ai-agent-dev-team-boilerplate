import { Clock, Fingerprint, Mail, MapPin, Phone, PencilLine } from 'lucide-react';
import React, { type JSX } from 'react';

import { EmpresaActionButton } from '../empresa-action-button';
import { EmpresaBadge, EmpresaBadgeRow } from '../empresa-badge';
import { EmpresaDaySelector } from '../empresa-day-selector';
import { EmpresaFieldRow, EmpresaFormField } from '../empresa-form-field';
import { EmpresaFormLayout } from '../empresa-form-layout';
import { EmpresaLogoPanel } from '../empresa-logo-panel';
import { EmpresaMetadataCard } from '../empresa-metadata-card';
import { EmpresaPage } from '../empresa-page';
import { EmpresaPageHeader } from '../empresa-page-header';
import { EmpresaSchedulePreview } from '../empresa-schedule-preview';
import { EmpresaSectionCard } from '../empresa-section-card';
import type {
  EmpresaInformacionValues,
  EmpresaMetadataItem,
  EmpresaSize,
  EmpresaTheme,
  EmpresaWeekday,
} from '../shared/empresa-types';

export interface EmpresaInformacionPreviewProps {
  tenantLabel?: string;
  values?: EmpresaInformacionValues;
  metadata?: EmpresaMetadataItem[];
  editing?: boolean;
  accessBadgeLabel?: string;
  showSyncBadge?: boolean;
  onEditClick?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  saveLoading?: boolean;
  onFieldChange?: (field: keyof EmpresaInformacionValues, value: string | EmpresaWeekday[]) => void;
  theme?: EmpresaTheme;
  size?: EmpresaSize;
  className?: string;
}

const defaultValues: Required<EmpresaInformacionValues> = {
  restaurantName: 'Palos de Leña',
  taxId: '900.123.456-7',
  address: 'Cra 13 # 63-40, Cartagena',
  phone: '+57 601 234 5678',
  email: 'contacto@palosdelena.com',
  openTime: '07:00',
  closeTime: '22:00',
  operatingDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
};

const defaultMetadata: EmpresaMetadataItem[] = [
  { label: 'Tenant ID', value: 'palos-de-lena' },
  { label: 'Plan', value: 'Enterprise' },
  { label: 'Región', value: 'Colombia' },
  { label: 'Última modificación', value: '14 jun 2026' },
];

export function EmpresaInformacionPreview({
  tenantLabel = 'Palos de Leña S.A.S.',
  values = {},
  metadata = defaultMetadata,
  editing = false,
  accessBadgeLabel = 'Owner · Acceso completo',
  showSyncBadge = true,
  onEditClick,
  onSave,
  onCancel,
  saveLoading = false,
  onFieldChange,
  theme = 'dark',
  size = 'md',
  className,
}: EmpresaInformacionPreviewProps): JSX.Element {
  const mergedValues = { ...defaultValues, ...values };
  const readOnly = !editing;

  return (
    <EmpresaPage theme={theme} size={size} className={className}>
      <EmpresaPageHeader
        theme={theme}
        size={size}
        title="Información del Restaurante"
        subtitle={`Datos del tenant · ${tenantLabel}`}
        actions={
          editing ? (
            <>
              <EmpresaActionButton
                theme={theme}
                size={size}
                variant="secondary"
                onClick={onCancel}
                disabled={!onCancel || saveLoading}
              >
                Cancelar
              </EmpresaActionButton>
              <EmpresaActionButton
                theme={theme}
                size={size}
                variant="primary"
                onClick={onSave}
                disabled={!onSave || saveLoading}
              >
                {saveLoading ? 'Guardando…' : 'Guardar cambios'}
              </EmpresaActionButton>
            </>
          ) : (
            <EmpresaActionButton
              theme={theme}
              size={size}
              variant="primary"
              onClick={onEditClick}
              disabled={!onEditClick}
            >
              <PencilLine size={14} strokeWidth={2} aria-hidden />
              Editar información
            </EmpresaActionButton>
          )
        }
      />

      <EmpresaBadgeRow theme={theme} size={size}>
        <EmpresaBadge theme={theme} size={size} variant="success">
          {accessBadgeLabel}
        </EmpresaBadge>
        {showSyncBadge ? (
          <EmpresaBadge theme={theme} size={size} variant="primary" showDot>
            Sincronizado con GraphQL
          </EmpresaBadge>
        ) : null}
      </EmpresaBadgeRow>

      <EmpresaFormLayout
        theme={theme}
        size={size}
        main={
          <>
            <EmpresaSectionCard
              theme={theme}
              size={size}
              title="Logo del restaurante"
              icon={<Fingerprint size={14} strokeWidth={1.75} aria-hidden />}
            >
              <EmpresaLogoPanel theme={theme} size={size} />
            </EmpresaSectionCard>

            <EmpresaSectionCard
              theme={theme}
              size={size}
              title="Identificación"
              icon={<Fingerprint size={14} strokeWidth={1.75} aria-hidden />}
            >
              <EmpresaFormField
                theme={theme}
                size={size}
                label="Nombre del restaurante"
                value={mergedValues.restaurantName}
                readOnly={readOnly}
                onChange={(event) => onFieldChange?.('restaurantName', event.target.value)}
              />
              <EmpresaFormField
                theme={theme}
                size={size}
                label="NIT / Identificación fiscal"
                value={mergedValues.taxId}
                readOnly={readOnly}
                onChange={(event) => onFieldChange?.('taxId', event.target.value)}
              />
            </EmpresaSectionCard>

            <EmpresaSectionCard
              theme={theme}
              size={size}
              title="Contacto"
              icon={<Mail size={14} strokeWidth={1.75} aria-hidden />}
            >
              <EmpresaFormField
                theme={theme}
                size={size}
                label="Dirección principal"
                icon={<MapPin size={12} strokeWidth={1.75} aria-hidden />}
                value={mergedValues.address}
                readOnly={readOnly}
                onChange={(event) => onFieldChange?.('address', event.target.value)}
              />
              <EmpresaFieldRow theme={theme} size={size}>
                <EmpresaFormField
                  theme={theme}
                  size={size}
                  label="Teléfono"
                  icon={<Phone size={12} strokeWidth={1.75} aria-hidden />}
                  value={mergedValues.phone}
                  readOnly={readOnly}
                  onChange={(event) => onFieldChange?.('phone', event.target.value)}
                />
                <EmpresaFormField
                  theme={theme}
                  size={size}
                  label="Correo electrónico"
                  icon={<Mail size={12} strokeWidth={1.75} aria-hidden />}
                  value={mergedValues.email}
                  readOnly={readOnly}
                  onChange={(event) => onFieldChange?.('email', event.target.value)}
                />
              </EmpresaFieldRow>
            </EmpresaSectionCard>
          </>
        }
        side={
          <>
            <EmpresaSectionCard
              theme={theme}
              size={size}
              title="Horario de operación"
              icon={<Clock size={14} strokeWidth={1.75} aria-hidden />}
            >
              <EmpresaFieldRow theme={theme} size={size}>
                <EmpresaFormField
                  theme={theme}
                  size={size}
                  label="Apertura"
                  value={mergedValues.openTime}
                  readOnly={readOnly}
                  onChange={(event) => onFieldChange?.('openTime', event.target.value)}
                />
                <EmpresaFormField
                  theme={theme}
                  size={size}
                  label="Cierre"
                  value={mergedValues.closeTime}
                  readOnly={readOnly}
                  onChange={(event) => onFieldChange?.('closeTime', event.target.value)}
                />
              </EmpresaFieldRow>

              <EmpresaDaySelector
                theme={theme}
                size={size}
                value={mergedValues.operatingDays}
                disabled={readOnly}
                onChange={(days) => onFieldChange?.('operatingDays', days)}
              />

              <EmpresaSchedulePreview
                theme={theme}
                size={size}
                openTime={mergedValues.openTime}
                closeTime={mergedValues.closeTime}
              />
            </EmpresaSectionCard>

            <EmpresaMetadataCard theme={theme} size={size} items={metadata} />
          </>
        }
      />
    </EmpresaPage>
  );
}

export default EmpresaInformacionPreview;
