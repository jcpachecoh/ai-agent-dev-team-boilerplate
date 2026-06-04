import React, { type JSX } from 'react';

import styles from './RecetaInfoPanel.module.scss';
import type { RecetaTheme } from '../shared/receta-types';

export interface RecetaInfoPanelProps {
  title?: string;
  nameLabel?: string;
  categoryLabel?: string;
  yieldLabel?: string;
  descriptionLabel?: string;
  nameValue?: string;
  categoryValue?: string;
  yieldValue?: string;
  descriptionValue?: string;
  onNameChange?: (value: string) => void;
  onCategoryChange?: (value: string) => void;
  onYieldChange?: (value: string) => void;
  onDescriptionChange?: (value: string) => void;
  showCategoryField?: boolean;
  theme?: RecetaTheme;
  className?: string;
}

const themeClasses: Record<RecetaTheme, string> = {
  light: styles.themeLight,
  dark: styles.themeDark,
};

export function RecetaInfoPanel({
  title = 'Información General',
  nameLabel = 'Nombre de la Receta *',
  categoryLabel = 'Categoría *',
  yieldLabel = 'Rendimiento',
  descriptionLabel = 'Descripción',
  nameValue = 'Lomo de Cerdo al Carbón',
  categoryValue = '',
  yieldValue = '4 porciones',
  descriptionValue = 'Descripción general de la receta...',
  onNameChange,
  onCategoryChange,
  onYieldChange,
  onDescriptionChange,
  showCategoryField = true,
  theme = 'dark',
  className,
}: RecetaInfoPanelProps): JSX.Element {
  return (
    <section className={[styles.panel, themeClasses[theme], className].filter(Boolean).join(' ')}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.label}>{nameLabel}</span>
          <input
            className={styles.input}
            value={nameValue}
            readOnly={!onNameChange}
            onChange={(event) => onNameChange?.(event.target.value)}
          />
        </label>
        {showCategoryField ? (
          <label className={styles.field}>
            <span className={styles.label}>{categoryLabel}</span>
            <input
              className={styles.input}
              value={categoryValue}
              readOnly={!onCategoryChange}
              onChange={(event) => onCategoryChange?.(event.target.value)}
            />
          </label>
        ) : null}
      </div>
      <div className={styles.gridSecondary}>
        <label className={styles.field}>
          <span className={styles.label}>{yieldLabel}</span>
          <input
            className={styles.input}
            value={yieldValue}
            readOnly={!onYieldChange}
            onChange={(event) => onYieldChange?.(event.target.value)}
          />
        </label>
      </div>
      <label className={[styles.field, styles.descriptionField].join(' ')}>
        <span className={styles.label}>{descriptionLabel}</span>
        <textarea
          className={[styles.input, styles.textarea].join(' ')}
          value={descriptionValue}
          readOnly={!onDescriptionChange}
          onChange={(event) => onDescriptionChange?.(event.target.value)}
        />
      </label>
    </section>
  );
}

export default RecetaInfoPanel;
