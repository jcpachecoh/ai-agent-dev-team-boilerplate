import { Eye, MapPin, SquarePen } from 'lucide-react';
import React, { type JSX } from 'react';

import styles from './ProduccionStationTableRow.module.scss';
import { ProduccionStatusBadge } from '../produccion-status-badge/ProduccionStatusBadge';
import { ProduccionTypeBadge } from '../produccion-type-badge/ProduccionTypeBadge';
import type {
  ProduccionSize,
  ProduccionStationRowData,
  ProduccionTheme,
} from '../shared/produccion-types';

export interface ProduccionStationTableRowProps extends ProduccionStationRowData {
  onView?: () => void;
  onEdit?: () => void;
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}

export function ProduccionStationTableRow({
  code = 'EST-01',
  name = 'Mise en place',
  location = 'Zona A - Preparación',
  type = 'Preparación',
  typeTone = 'preparation',
  capacityLabel = '3 op.',
  status = 'active',
  recipeCountLabel = '2 recetas',
  onView,
  onEdit,
  theme = 'dark',
  size = 'xl',
  className,
}: ProduccionStationTableRowProps): JSX.Element {
  return (
    <div
      className={[styles.row, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
    >
      <span className={styles.inner}>
        <span className={styles.code} data-label="Código" role="cell">
          {code}
        </span>
        <span className={styles.name} data-label="Nombre" role="cell">
          {name}
        </span>
        <span className={styles.location} data-label="Ubicación" role="cell">
          <MapPin aria-hidden />
          {location}
        </span>
        <span data-label="Tipo" role="cell">
          <ProduccionTypeBadge label={type} tone={typeTone} theme={theme} size="sm" />
        </span>
        <span className={styles.mono} data-label="Capac." role="cell">
          {capacityLabel}
        </span>
        <span data-label="Estado" role="cell">
          <ProduccionStatusBadge status={status} theme={theme} size="sm" />
        </span>
        <span className={styles.subtle} data-label="Recetas" role="cell">
          {recipeCountLabel ?? '—'}
        </span>
        <span className={styles.actions} data-label="Acciones" role="cell">
          <button
            type="button"
            className={styles.actionButton}
            onClick={onView}
            aria-label={`Ver estación ${code}`}
          >
            <Eye size={12} aria-hidden />
            Ver
          </button>
          <button
            type="button"
            className={[styles.actionButton, styles.actionButtonPrimary].join(' ')}
            onClick={onEdit}
            aria-label={`Editar estación ${code}`}
          >
            <SquarePen size={12} aria-hidden />
            Editar
          </button>
        </span>
      </span>
    </div>
  );
}

export default ProduccionStationTableRow;
