import { ChevronRight } from 'lucide-react';
import React, { type JSX, type KeyboardEvent } from 'react';

import styles from './ProduccionRecipeTableRow.module.scss';
import { ProduccionStatusBadge } from '../produccion-status-badge/ProduccionStatusBadge';
import type {
  ProduccionRecipeRowData,
  ProduccionSize,
  ProduccionTheme,
} from '../shared/produccion-types';

export interface ProduccionRecipeTableRowProps extends ProduccionRecipeRowData {
  onClick?: () => void;
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}
export function ProduccionRecipeTableRow({
  name = 'Costillas BBQ',
  category = 'Proteínas',
  productName = 'Costillas BBQ 300g',
  batchSizeLabel = '30 kg',
  phaseCount = 4,
  totalTimeLabel = '2h 25min',
  versionLabel = 'v1.8',
  status = 'published',
  selected = false,
  onClick,
  theme = 'dark',
  size = 'xl',
  className,
}: ProduccionRecipeTableRowProps): JSX.Element {
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
        <span className={styles.main} data-label="Nombre" role="cell">
          <span className={styles.name}>{name}</span>
          {category ? <span className={styles.subtle}>{category}</span> : null}
        </span>
        <span className={styles.subtle} data-label="Producto" role="cell">
          {productName}
        </span>
        <span className={styles.mono} data-label="Lote" role="cell">
          {batchSizeLabel}
        </span>
        <span className={styles.mono} data-label="Fases" role="cell">
          {phaseCount}
        </span>
        <span className={styles.time} data-label="Tiempo total" role="cell">
          {totalTimeLabel}
        </span>
        <span className={styles.mono} data-label="Versión" role="cell">
          {versionLabel}
        </span>
        <span data-label="Estado" role="cell">
          <ProduccionStatusBadge status={status} theme={theme} size="sm" />
        </span>
        <span className={styles.chevron} role="cell">
          <ChevronRight aria-hidden />
        </span>
      </span>
    </button>
  );
}
export default ProduccionRecipeTableRow;
