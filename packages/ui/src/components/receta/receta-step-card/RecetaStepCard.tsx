import { Clock3, GripVertical, Pencil, Trash2, Users } from 'lucide-react';
import React, { type JSX } from 'react';

import styles from './RecetaStepCard.module.scss';
import type { RecetaTheme } from '../shared/receta-types';

export interface RecetaStepCardProps {
  stepNumber?: number;
  title?: string;
  description?: string;
  duration?: string;
  assignee?: string;
  selected?: boolean;
  theme?: RecetaTheme;
  onEdit?: () => void;
  onDelete?: () => void;
  readOnly?: boolean;
  className?: string;
}

const themeClasses: Record<RecetaTheme, string> = {
  light: styles.themeLight,
  dark: styles.themeDark,
};

export function RecetaStepCard({
  stepNumber = 1,
  title = 'Preparación de ingredientes',
  description = 'Lavar, cortar y preparar todos los ingredientes según especificaciones',
  duration = '15 min',
  assignee = 'Operario',
  selected = true,
  theme = 'dark',
  onEdit,
  onDelete,
  readOnly = false,
  className,
}: RecetaStepCardProps): JSX.Element {
  return (
    <article
      className={[styles.card, themeClasses[theme], selected && styles.selected, className]
        .filter(Boolean)
        .join(' ')}
    >
      <GripVertical className={styles.dragIcon} aria-hidden />
      <span className={styles.stepNumber}>{stepNumber}</span>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <Clock3 aria-hidden />
            {duration}
          </span>
          <span className={styles.metaItem}>
            <Users aria-hidden />
            {assignee}
          </span>
        </div>
      </div>
      <div className={styles.actions}>
        {!readOnly ? (
          <>
            <button
              type="button"
              className={styles.iconButton}
              onClick={onEdit}
              aria-label="Editar paso"
            >
              <Pencil aria-hidden />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={onDelete}
              aria-label="Eliminar paso"
            >
              <Trash2 aria-hidden />
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}

export default RecetaStepCard;
