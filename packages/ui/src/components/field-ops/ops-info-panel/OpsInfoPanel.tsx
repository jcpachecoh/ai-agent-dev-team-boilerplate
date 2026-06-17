import type { JSX, ReactNode } from 'react';

import type { FieldOpsSize, FieldOpsTheme } from '../shared/field-ops-types';
import styles from './OpsInfoPanel.module.scss';

export interface OpsInfoPanelItem {
  id: string;
  icon?: ReactNode;
  text: ReactNode;
}

export interface OpsInfoPanelProps {
  title: string;
  items?: OpsInfoPanelItem[];
  children?: ReactNode;
  footer?: ReactNode;
  theme?: FieldOpsTheme;
  size?: FieldOpsSize;
  className?: string;
}

export function OpsInfoPanel({
  title,
  items = [],
  children,
  footer,
  theme = 'light',
  size = 'md',
  className,
}: OpsInfoPanelProps): JSX.Element {
  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];

  return (
    <section className={[styles.panel, themeClass, sizeClass, className].filter(Boolean).join(' ')}>
      <header className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
      </header>
      <div className={styles.body}>
        {items.length > 0 && (
          <ol className={styles.list}>
            {items.map((item, index) => (
              <li key={item.id} className={styles.item}>
                <span className={styles.index}>{index + 1}</span>
                {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
                <span className={styles.itemText}>{item.text}</span>
              </li>
            ))}
          </ol>
        )}
        {children}
      </div>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </section>
  );
}

export default OpsInfoPanel;
