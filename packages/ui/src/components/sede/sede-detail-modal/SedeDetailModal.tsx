import React, { type JSX } from 'react';

import { SedeActionButton } from '../sede-action-button';
import { SedeAssignedUsersPanel } from '../sede-assigned-users-panel';
import { SedeFormCard } from '../sede-form-card';
import { SedeFormField } from '../sede-form-field';
import { SedeStatusBadge } from '../sede-status-badge';
import type { SedeFormPreviewValues } from '../sede-form-preview';
import type { SedeAssignedUser, SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedeDetailModal.module.scss';

export interface SedeDetailModalProps {
  open?: boolean;
  title?: string;
  locationId?: string;
  values?: SedeFormPreviewValues;
  assignedUsers?: SedeAssignedUser[];
  userSearchValue?: string;
  onUserSearchChange?: (value: string) => void;
  loading?: boolean;
  loadError?: string;
  onClose?: () => void;
  onEdit?: () => void;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedeDetailModal({
  open = false,
  title = 'Consultar sede',
  locationId,
  values = {},
  assignedUsers = [],
  userSearchValue = '',
  onUserSearchChange,
  loading = false,
  loadError,
  onClose,
  onEdit,
  theme = 'dark',
  size = 'md',
  className,
}: SedeDetailModalProps): JSX.Element | null {
  if (!open) {
    return null;
  }

  const isActive = values.isActive ?? true;

  return (
    <div
      className={[styles.backdrop, styles[`theme--${theme}`]].filter(Boolean).join(' ')}
      role="presentation"
      onClick={onClose}
    >
      <section
        className={[styles.modal, styles[`theme--${theme}`], styles[`size--${size}`], className]
          .filter(Boolean)
          .join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sede-detail-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.titles}>
            <h2 id="sede-detail-modal-title" className={styles.title}>
              {title}
            </h2>
            {locationId ? <p className={styles.subtitle}>ID: {locationId}</p> : null}
          </div>
          {onClose ? (
            <button type="button" className={styles.closeButton} onClick={onClose}>
              Cerrar
            </button>
          ) : null}
        </header>

        <div className={styles.body}>
          {loadError ? (
            <p className={styles.errorMessage} role="alert">
              {loadError}
            </p>
          ) : (
            <div className={styles.layout}>
              <div className={styles.main}>
                <SedeFormCard title="Información básica" theme={theme} size={size}>
                  <SedeFormField
                    label="Nombre de la sede"
                    value={values.name ?? ''}
                    readOnly
                    theme={theme}
                    size={size}
                    disabled={loading}
                  />
                  <SedeFormField
                    label="Dirección"
                    value={values.address ?? ''}
                    readOnly
                    theme={theme}
                    size={size}
                    disabled={loading}
                  />
                  <SedeFormField
                    label="Ciudad"
                    value={values.city ?? ''}
                    readOnly
                    theme={theme}
                    size={size}
                    disabled={loading}
                  />
                  <SedeFormField
                    label="Teléfono"
                    value={values.phone ?? ''}
                    readOnly
                    theme={theme}
                    size={size}
                    disabled={loading}
                  />
                  <div className={styles.statusField}>
                    <span className={styles.statusLabel}>Estado</span>
                    <SedeStatusBadge
                      status={isActive ? 'active' : 'inactive'}
                      theme={theme}
                      size="sm"
                    />
                  </div>
                </SedeFormCard>
              </div>

              <div className={styles.side}>
                <SedeAssignedUsersPanel
                  users={assignedUsers}
                  searchValue={userSearchValue}
                  onSearchChange={onUserSearchChange}
                  description="Usuarios con acceso a esta sede."
                  theme={theme}
                  size={size}
                />
              </div>
            </div>
          )}
        </div>

        {onEdit ? (
          <footer className={styles.footer}>
            <SedeActionButton
              variant="secondary"
              label="Editar sede"
              theme={theme}
              size={size}
              onClick={onEdit}
              disabled={loading || Boolean(loadError)}
            />
          </footer>
        ) : null}
      </section>
    </div>
  );
}

export default SedeDetailModal;
