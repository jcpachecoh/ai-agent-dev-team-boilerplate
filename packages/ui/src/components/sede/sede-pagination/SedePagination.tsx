import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { type JSX } from 'react';

import type { SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedePagination.module.scss';

export interface SedePaginationProps {
  page?: number;
  totalPages?: number;
  summary?: string;
  pageLabel?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedePagination({
  page = 1,
  totalPages = 1,
  summary,
  pageLabel,
  onPrevious,
  onNext,
  theme = 'dark',
  size = 'md',
  className,
}: SedePaginationProps): JSX.Element {
  const resolvedSummary = summary ?? `Mostrando 1-6 de 10`;
  const resolvedPageLabel = pageLabel ?? `Pág. ${page} / ${totalPages}`;
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <nav
      className={[styles.pagination, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      aria-label="Paginación de sedes"
    >
      <span className={styles.summary}>{resolvedSummary}</span>
      <div className={styles.controls}>
        <span className={styles.pageLabel}>{resolvedPageLabel}</span>
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

export default SedePagination;
