import React, { type JSX } from 'react';

import { SedeTableCard } from '../sede-table-card';
import { SedeTableRow } from '../sede-table-row';
import type { SedeTableRowProps } from '../sede-table-row';
import styles from './SedeTableItem.module.scss';

export type SedeTableItemProps = SedeTableRowProps;

export function SedeTableItem({ className, ...props }: SedeTableItemProps): JSX.Element {
  return (
    <>
      <SedeTableRow {...props} className={[styles.desktop, className].filter(Boolean).join(' ')} />
      <SedeTableCard {...props} className={[styles.mobile, className].filter(Boolean).join(' ')} />
    </>
  );
}

export default SedeTableItem;
