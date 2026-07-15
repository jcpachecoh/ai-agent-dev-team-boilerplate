import type { MedicalLeaveSummary } from '../types/medical-leaves.types';
import type { EmpleadoTheme } from '@restopsiq/ui';
import { MedicalLeaveTableCard } from './MedicalLeaveTableCard';
import { MedicalLeaveTableRow } from './MedicalLeaveTableRow';
import styles from './MedicalLeaveTableItem.module.scss';

interface Props {
  leave: MedicalLeaveSummary;
  theme: EmpleadoTheme;
  gridTemplate: string;
  canWrite: boolean;
  downloading: boolean;
  statusBusy: boolean;
  onView: () => void;
  onDownload: () => void;
  onRadicate: () => void;
  onRecovered: () => void;
  onReject: () => void;
}

export function MedicalLeaveTableItem({ gridTemplate, ...props }: Props): React.JSX.Element {
  return (
    <>
      <div className={styles.desktop}>
        <MedicalLeaveTableRow {...props} gridTemplate={gridTemplate} />
      </div>
      <MedicalLeaveTableCard {...props} />
    </>
  );
}
