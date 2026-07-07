import type { JSX } from 'react';

import { CargoTableCard } from '../cargo-table-card';
import { CargoTableRow, type CargoTableRowProps } from '../cargo-table-row';
import styles from './CargoTableItem.module.scss';

export type CargoTableItemProps = CargoTableRowProps;

export function CargoTableItem({ className, ...props }: CargoTableItemProps): JSX.Element {
  return (
    <>
      <CargoTableRow {...props} className={[styles.desktop, className].filter(Boolean).join(' ')} />
      <CargoTableCard {...props} className={[styles.mobile, className].filter(Boolean).join(' ')} />
    </>
  );
}

export default CargoTableItem;
