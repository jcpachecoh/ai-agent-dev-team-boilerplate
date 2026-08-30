import { PhaseIndicator, type PhaseOperator } from '@restopsiq/ui';
import React from 'react';

import styles from './OperatorChipsFooter.module.scss';

export interface OperatorChipsFooterProps {
  operators: PhaseOperator[];
  theme?: 'light' | 'dark';
}

export function OperatorChipsFooter({
  operators,
  theme = 'dark',
}: OperatorChipsFooterProps): React.JSX.Element {
  return (
    <footer className={styles.footer}>
      <PhaseIndicator
        theme={theme}
        size="sm"
        title="Operadores en turno"
        operators={operators}
        className={styles.panel}
      />
    </footer>
  );
}

export default OperatorChipsFooter;
