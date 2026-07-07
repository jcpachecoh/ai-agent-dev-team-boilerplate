import React, { type JSX, Fragment } from 'react';

import type { EmpresaMetadataItem, EmpresaSize, EmpresaTheme } from '../shared/empresa-types';
import styles from './EmpresaMetadataCard.module.scss';

export interface EmpresaMetadataCardProps {
  items: EmpresaMetadataItem[];
  theme?: EmpresaTheme;
  size?: EmpresaSize;
  className?: string;
}

export function EmpresaMetadataCard({
  items,
  theme = 'dark',
  size = 'md',
  className,
}: EmpresaMetadataCardProps): JSX.Element {
  return (
    <aside
      className={[styles.card, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 ? <div className={styles.divider} aria-hidden /> : null}
          <div className={styles.item}>
            <span className={styles.label}>{item.label}</span>
            <span className={styles.value}>{item.value}</span>
          </div>
        </Fragment>
      ))}
    </aside>
  );
}

export default EmpresaMetadataCard;
