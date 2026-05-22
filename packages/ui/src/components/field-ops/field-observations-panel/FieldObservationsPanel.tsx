import * as React from 'react';

import type { FieldOpsSize, FieldOpsTheme } from '../shared/field-ops-types';
import styles from './FieldObservationsPanel.module.scss';

export interface FieldObservationsPanelProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'size'
> {
  label?: string;
  theme?: FieldOpsTheme;
  size?: FieldOpsSize;
}

export const FieldObservationsPanel = React.forwardRef<
  HTMLTextAreaElement,
  FieldObservationsPanelProps
>(function FieldObservationsPanel(
  {
    label = 'Observaciones opcionales',
    theme = 'light',
    size = 'md',
    className,
    placeholder = 'Ej: Se presentó variación en pesos por merma…',
    rows,
    ...props
  },
  ref,
) {
  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];
  const textareaId = React.useId();

  return (
    <div className={[styles.panel, themeClass, sizeClass, className].filter(Boolean).join(' ')}>
      <label className={styles.label} htmlFor={textareaId}>
        {label}
      </label>
      <textarea
        ref={ref}
        id={textareaId}
        className={styles.textarea}
        placeholder={placeholder}
        rows={rows ?? (size === 'sm' ? 3 : size === 'xl' ? 6 : 4)}
        {...props}
      />
    </div>
  );
});

FieldObservationsPanel.displayName = 'FieldObservationsPanel';

export default FieldObservationsPanel;
