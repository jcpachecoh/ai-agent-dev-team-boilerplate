import * as React from 'react';
import styles from './Card.module.scss';
import { Truck } from 'lucide-react';

export interface CardProps {
  title?: string;
  count?: number;
  total?: number;
  theme?: 'light' | 'dark';
}

export function Card({
  title = 'Vehículos Disponibles',
  count = 3,
  total = 4,
  theme = 'light',
}: CardProps) {
  const themeClass = theme === 'dark' ? styles.dark : styles.light;

  return (
    <div className={[styles.container, themeClass].join(' ')}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        <div className={styles.icon}>
          <Truck />
        </div>
      </div>

      <div className={styles.count} aria-label={`available ${count}`}>
        {count}
      </div>

      <div className={styles.footer}>{`de ${total} en flota`}</div>
    </div>
  );
}
