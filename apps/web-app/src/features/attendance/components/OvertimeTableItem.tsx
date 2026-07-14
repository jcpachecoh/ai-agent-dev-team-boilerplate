import type { EmpleadoTheme } from '@restopsiq/ui';

import type { OvertimeRequestItem } from '../types/overtime.types';
import { OvertimeTableRow } from './OvertimeTableRow';
import styles from './OvertimeTableItem.module.scss';

interface Props {
  item: OvertimeRequestItem;
  theme: EmpleadoTheme;
  showActions: boolean;
  actionsDisabled?: boolean;
  onApprove: () => void;
  onObject: () => void;
}

export function OvertimeTableItem(props: Props): React.JSX.Element {
  return (
    <div className={styles.desktop}>
      <OvertimeTableRow {...props} />
    </div>
  );
}
