import { ChevronDown, UserRound } from 'lucide-react';
import React, { type JSX } from 'react';

import { RecetaResultButton } from '../receta-result-button';
import type { RecetaResult, RecetaSize, RecetaTheme } from '../shared/receta-types';
import styles from './RecetaHistoryTableRow.module.scss';

export interface RecetaHistoryTableRowProps {
  code?: string;
  recipeName?: string;
  operatorName?: string;
  date?: string;
  progress?: string;
  result?: RecetaResult;
  validationsOk?: number;
  validationsFailed?: number;
  duration?: string;
  details?: string;
  onResultClick?: () => void;
  theme?: RecetaTheme;
  size?: RecetaSize;
  className?: string;
}

export function RecetaHistoryTableRow({
  code = 'EX-001',
  recipeName = 'Lomo de Cerdo al Carbón',
  operatorName = 'Carlos Méndez',
  date = '25 de may, 08:30 a. m.',
  progress = '6/6',
  result = 'ok',
  validationsOk = 12,
  validationsFailed = 0,
  duration = '47 / 45 min',
  details,
  onResultClick,
  theme = 'light',
  size = 'md',
  className,
}: RecetaHistoryTableRowProps): JSX.Element {
  return (
    <div
      className={[styles.row, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
    >
      <span className={styles.code} role="cell">
        {code}
      </span>
      <span className={styles.recipe} role="cell">
        <span className={styles.recipeName}>{recipeName}</span>
        <span className={styles.operator}>
          <UserRound aria-hidden /> {operatorName}
        </span>
      </span>
      <span className={styles.date} role="cell">
        {date}
      </span>
      <span className={styles.progress} role="cell">
        {progress}
      </span>
      <span className={styles.validation} role="cell">
        <span className={styles.smallLabel}>Validaciones</span>
        <span>
          <strong>{validationsOk}</strong> <em>/</em> <b>{validationsFailed}</b>
        </span>
      </span>
      <span className={styles.duration} role="cell">
        <span className={styles.smallLabel}>Duración</span>
        <span>{duration}</span>
      </span>
      <span className={styles.result} role="cell">
        <RecetaResultButton variant={result} theme={theme} size="md" onClick={onResultClick} />
      </span>
      <span className={styles.details} role="cell" aria-label={details ?? 'Ver detalles'}>
        <ChevronDown aria-hidden />
      </span>
    </div>
  );
}

export default RecetaHistoryTableRow;
