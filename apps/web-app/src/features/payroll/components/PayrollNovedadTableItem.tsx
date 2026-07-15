import type { EmpleadoTheme } from '@restopsiq/ui';

import type { PayrollNovedadSummary } from '../types/payroll-novedades.types';
import { PayrollNovedadTableCard } from './PayrollNovedadTableCard';
import { PayrollNovedadTableRow } from './PayrollNovedadTableRow';
import styles from './PayrollNovedadTableItem.module.scss';

interface Props {
  novedad: PayrollNovedadSummary;
  theme: EmpleadoTheme;
  gridTemplate: string;
  showActions: boolean;
  showEdit: boolean;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
}

export function PayrollNovedadTableItem({ gridTemplate, ...props }: Props): React.JSX.Element {
  return (
    <>
      <div className={styles.desktop}>
        <PayrollNovedadTableRow {...props} gridTemplate={gridTemplate} />
      </div>
      <PayrollNovedadTableCard {...props} />
    </>
  );
}
