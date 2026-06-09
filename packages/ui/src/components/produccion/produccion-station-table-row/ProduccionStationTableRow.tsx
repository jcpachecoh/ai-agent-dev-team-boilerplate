import { ChevronRight, MapPin } from 'lucide-react';
import React, { type JSX, type KeyboardEvent } from 'react';

import styles from './ProduccionStationTableRow.module.scss';
import { ProduccionStatusBadge } from '../produccion-status-badge/ProduccionStatusBadge';
import { ProduccionTypeBadge } from '../produccion-type-badge/ProduccionTypeBadge';
import type {
  ProduccionSize,
  ProduccionStationRowData,
  ProduccionTheme,
} from '../shared/produccion-types';

export interface ProduccionStationTableRowProps extends ProduccionStationRowData {
  onClick?: () => void;
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
  selected = false,
  onClick,
  theme = 'dark',
  size = 'xl',
  className,
}: ProduccionStationTableRowProps): JSX.Element {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.();
    }
  };
  return (
    <button
      type="button"
      className={[
        styles.rowButton,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        selected && styles.selected,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-selected={selected}
      onClick={onClick}
      onKeyDown={handleKeyDown}
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
        <span className={styles.chevron} role="cell">
          <ChevronRight aria-hidden />
        </span>
      </span>
    </button>
  );
}
export default ProduccionStationTableRow;
