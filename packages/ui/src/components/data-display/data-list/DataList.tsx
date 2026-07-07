import * as React from 'react';

import styles from './DataList.module.scss';

export interface DataListItem {
  label: string;
  value: React.ReactNode;
  span?: 1 | 2;
}

export interface DataListProps {
  items: DataListItem[];
  columns?: 1 | 2;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'xl';
  className?: string;
}

export const DataList: React.FC<DataListProps> = ({
  items,
  columns = 2,
  theme = 'dark',
  size = 'md',
  className,
}) => {
  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];

  return (
    <div
      className={[
        styles.list,
        columns === 2 ? styles.cols2 : styles.cols1,
        sizeClass,
        themeClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className={[styles.item, item.span === 2 && styles.span2].filter(Boolean).join(' ')}
        >
          <dt className={styles.label}>{item.label}</dt>
          <dd className={styles.value}>{item.value}</dd>
        </div>
      ))}
    </div>
  );
};

export default DataList;
