import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { type JSX } from 'react';

import type { InventarioSize, InventarioTheme } from '../shared/inventario-types';
import styles from './InventarioPagination.module.scss';

export interface InventarioPaginationProps {
  page?: number;
  totalPages?: number;
  summary?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

export function InventarioPagination({
  page = 1,
  totalPages = 10,
  summary,
  onPrevious,
  onNext,
  theme = 'light',
  size = 'md',
  className,
}: InventarioPaginationProps): JSX.Element {
  const resolvedSummary = summary ?? `Página ${page} de ${totalPages}`;
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <nav
      className={[styles.pagination, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      aria-label="Paginación"
    >
      <span className={styles.summary}>{resolvedSummary}</span>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.navButton}
          onClick={onPrevious}
          disabled={prevDisabled}
          aria-label="Página anterior"
        >
          <ChevronLeft aria-hidden />
        </button>
        <button
          type="button"
          className={styles.navButton}
          onClick={onNext}
          disabled={nextDisabled}
          aria-label="Página siguiente"
        >
          <ChevronRight aria-hidden />
        </button>
      </div>
    </nav>
  );
}

export default InventarioPagination;
