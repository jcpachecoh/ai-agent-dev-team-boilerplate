import { Eye } from 'lucide-react';
import React, { type JSX } from 'react';

import styles from './ProduccionPhaseListItem.module.scss';
import type {
  ProduccionPhaseData,
  ProduccionSize,
  ProduccionTheme,
} from '../shared/produccion-types';

export interface ProduccionPhaseListItemProps extends ProduccionPhaseData {
  onPreview?: () => void;
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}
export function ProduccionPhaseListItem({
  order = 1,
  name = 'Deshuesado',
  stationLabel = 'EST-02 Corte y Deshuese',
  durationLabel = '25 min',
  operatorsLabel = '2–3 op.',
  requiresQA = false,
  onPreview,
  theme = 'dark',
  size = 'md',
  className,
}: ProduccionPhaseListItemProps): JSX.Element {
  return (
    <article
      className={[styles.item, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={styles.order}>{order}</span>
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <strong>{name}</strong>
          {requiresQA ? <span className={styles.qa}>QA</span> : null}
        </div>
        <p>
          {stationLabel}
          <strong>{durationLabel}</strong>
          {operatorsLabel ? <span>{operatorsLabel}</span> : null}
        </p>
      </div>
      {onPreview ? (
        <button
          type="button"
          className={styles.preview}
          onClick={onPreview}
          aria-label={`Previsualizar fase ${name}`}
        >
          <Eye aria-hidden />
        </button>
      ) : (
        <Eye className={styles.eye} aria-hidden />
      )}
    </article>
  );
}
export default ProduccionPhaseListItem;
