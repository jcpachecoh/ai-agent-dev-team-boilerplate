import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { JSX } from 'react';

import type { EmpleadoSize, EmpleadoTheme } from '../shared/empleado-types';
import styles from './EmpleadoPagination.module.scss';

export interface EmpleadoPaginationProps {
  page?: number;
  totalPages?: number;
  summary?: string;
  pageLabel?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  theme?: EmpleadoTheme;
  size?: EmpleadoSize;
  className?: string;
}

export function EmpleadoPagination({
  page = 1,
  totalPages = 1,
  summary,
  pageLabel,
  onPrevious,
  onNext,
  theme = 'dark',
  size = 'md',
  className,
}: EmpleadoPaginationProps): JSX.Element {
  const resolvedSummary = summary ?? '1-8 de 18';
  const resolvedPageLabel = pageLabel ?? `Pág. ${page}/${totalPages}`;
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <nav
      className={[styles.pagination, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      aria-label="Paginación de empleados"
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

export default EmpleadoPagination;
